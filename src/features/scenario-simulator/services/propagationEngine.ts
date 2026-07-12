/**
 * Propagation Engine  —  runPropagation()
 *
 * Deterministic capacity-constrained BFS propagation.
 * The LLM layer (Phase 4) narrates this output — it never modifies numbers.
 *
 * ─── Node type branching ───────────────────────────────────────────────────
 *   "throughput" nodes (corridors, ports — default):
 *     capacity = volume that can FLOW THROUGH
 *     → spare_capacity vs. diverted_volume logic applies
 *     → lockedVolume = affectedFlow × (1 - flexibilityFactor)
 *
 *   "production_output" nodes (infra_fertilizer_plants, future production nodes):
 *     capacity = volume that can be MADE
 *     → output_loss logic applies; no rerouting concept
 *     → lockedVolume = outputLoss (entire loss is locked)
 *     → spareCapacityMtpa = null (meaningless for factories)
 *
 * ─── Route family deduplication ───────────────────────────────────────────
 *   Sequential corridor nodes on the same route (e.g., corridor_suez +
 *   corridor_bab_el_mandeb both appear in a Suez-closure preset) would
 *   double-count the supply gap if summed.  The engine tracks which route
 *   families have been counted and zeroes the locked volume of secondary nodes.
 *
 * ─── Assumptions requirement ──────────────────────────────────────────────
 *   Every simplification MUST be logged in the assumptions array.
 *   No silent simplifications.
 */

import {
  INDIA_TRADE_GRAPH,
  type KnowledgeGraphNode,
} from "../../geopolitical-intelligence/knowledge-graph/indiaTradeGraph";
import type {
  CorridorImpactResult,
  DecisionLever,
  PropagationResult,
  RangeEstimate,
  SpotCharterLever,
  SsiWeights,
} from "../types";
import type { DisruptionPreset } from "../types";
import { DEFAULT_SSI_WEIGHTS, INDIA_RESERVE_CONFIG, type ReserveConfig } from "../constants/reserve-config";
import { computeReserveDrawdown } from "./reserveService";
import { computeMetrics } from "./metricsService";

// ─── India-specific flow fractions for global corridors ───────────────────
//
// "What fraction of this corridor's ACTUAL throughput is India-relevant?"
// Basis:
//   Hormuz: India imports ~175 Mtpa Gulf crude; Hormuz actual ~810 Mtpa → 22%
//   Suez: India's bilateral trade via Suez ~35 Mtpa; Suez actual ~715 Mtpa → 5%
//   Malacca: India eastbound cargo ~45 Mtpa; Malacca actual ~1353 Mtpa → ~6% (inc. re-exports)
//   SCS: India's SCS-transiting cargo est. ~4% of SCS volume
//   Black Sea: India is large grain+fertilizer buyer; ~15% of Black Sea cargo is India-bound
//   Bab-el-Mandeb: India's Red Sea cargo ~8% (containers + oil combined)
//   Cape: India's Cape-routed cargo fraction is small (~4%); mostly Europe rerouting
//
// ANALYST_ESTIMATE — not independently audited per cargo type.
// Stored in assumptions when any corridor node is processed.
//
const INDIA_CORRIDOR_FRACTION: Record<string, number> = {
  corridor_hormuz:          0.22,
  corridor_bab_el_mandeb:   0.08,
  corridor_suez:            0.05,
  corridor_malacca:         0.06,
  corridor_south_china_sea: 0.04,
  corridor_black_sea:       0.15,
  corridor_cape_good_hope:  0.04,
};

// ─── Route families ───────────────────────────────────────────────────────
//
// Corridor nodes sharing a family are sequential on the same route.
// Only the FIRST encountered node in a family contributes to supply gap.
// Subsequent nodes contribute to ETA + cost but not supply gap.
//
const ROUTE_FAMILY: Record<string, string> = {
  corridor_suez:           "europe_india_suez",
  corridor_bab_el_mandeb:  "europe_india_suez",
  corridor_cape_good_hope: "europe_india_cape",
  corridor_hormuz:         "gulf_india",
  corridor_malacca:        "asia_india",
  corridor_south_china_sea:"asia_india",
  corridor_black_sea:      "eurasia_grain",
};

// Alternative reroute addl days per category (used for ETA shift weighting)
const REROUTE_DAYS: Record<string, number> = {
  energy:          10,   // tankers can anchor or use VLCC short-haul alternatives
  food_agriculture:12,
  manufacturing:   14,   // container ships primarily reroute via Cape
  multi_sector:    14,
};

// ─── Port → upstream corridor map ───────────────────────────────────────
//
// When a port AND its upstream corridor both appear in the same preset's
// affectedNodeIds, the supply gap is already captured at the corridor level.
// The port contributes ETA impact but NOT additional locked volume.
//
const PORT_UPSTREAM_CORRIDOR: Record<string, string> = {
  port_jnpt:     "corridor_suez",   // JNPT primary west-side corridor
  port_mundra:   "corridor_hormuz", // Mundra primary source corridor
  port_kandla:   "corridor_hormuz",
  port_kochi:    "corridor_suez",
  port_mangalore:"corridor_hormuz",
  port_chennai:  "corridor_malacca",
  port_vizag:    "corridor_malacca",
  port_kolkata:  "corridor_malacca",
  port_ennore:   "corridor_malacca",
};

/**
 * Fraction of a port's total traffic that flows via a specific disrupted corridor.
 * A Suez closure does NOT affect all of Mundra's traffic — only the Suez-dependent
 * portion (machinery, chemicals from Europe). Oil from Gulf = Hormuz, not Suez.
 *
 * Keys: "portId:corridorId" → fraction [0.0–1.0]
 * ANALYST_ESTIMATE: derived from connection strategicWeight and commodity mix.
 */
const PORT_CORRIDOR_FRACTION: Record<string, number> = {
  // Suez corridor → port fractions
  "port_jnpt:corridor_suez":      0.35,  // JNPT: ~35% traffic is Europe/Med via Suez (containers)
  "port_mundra:corridor_suez":    0.17,  // Mundra: ~17% via Suez (containers + chemicals from Europe;
                                          //   bulk of Mundra traffic is Gulf crude via Hormuz)
  "port_kochi:corridor_suez":     0.30,  // Kochi: significant Europe-origin cargo
  "port_kandla:corridor_suez":    0.15,  // Kandla: mostly bulk/oil; smaller Suez fraction
  // Hormuz corridor → port fractions
  "port_mundra:corridor_hormuz":  0.55,  // Mundra: ~55% traffic is Gulf crude via Hormuz
  "port_kandla:corridor_hormuz":  0.60,
  "port_mangalore:corridor_hormuz":0.85, // NMPT: almost all traffic is Gulf crude
  "port_jnpt:corridor_hormuz":    0.08,  // JNPT: some LNG/chemicals via Hormuz
  "port_kochi:corridor_hormuz":   0.40,
  // Malacca corridor → port fractions
  "port_chennai:corridor_malacca": 0.45, // Chennai: significant Asia-origin containers
  "port_vizag:corridor_malacca":   0.40,
  "port_kolkata:corridor_malacca": 0.35,
  "port_ennore:corridor_malacca":  0.25,
};


export function runPropagation(
  preset: DisruptionPreset,
  levers: DecisionLever[],
  graph: KnowledgeGraphNode[] = INDIA_TRADE_GRAPH,
  ssiWeights: SsiWeights = DEFAULT_SSI_WEIGHTS,
  reserveConfig: ReserveConfig = INDIA_RESERVE_CONFIG,
): PropagationResult {

  const nodeMap = new Map<string, KnowledgeGraphNode>(
    graph.map((n) => [n.id, n]),
  );

  const assumptions: string[] = [
    "Spare capacity on alternative routes is not contested by global demand (v1 simplification — demand contention not modelled).",
    "India-specific corridor flow fractions are analyst estimates: Hormuz 22%, Suez 5%, Malacca 6%, Red Sea 8%, Black Sea 15%, SCS 4%, Cape 4%.",
    "Route-family deduplication: sequential corridor nodes on the same route (e.g., Suez + Bab-el-Mandeb) contribute to ETA/cost but supply gap is counted once per route family.",
    "Spot charter vessels are assumed immediately available; no lead-time modelled for vessel procurement (v1 simplification).",
  ];

  const countedRouteFamilies = new Set<string>();
  const nodeImpacts: CorridorImpactResult[] = [];

  // Accumulators for ETA shift calculation (weighted across affected nodes)
  let etaWeightedSum = 0;
  let etaWeightedSumMin = 0;
  let etaWeightedSumMax = 0;
  let etaWeightTotal = 0;

  // Total locked volume for supply gap (Mtpa, annualised)
  let totalLockedMtpa = 0;

  const rerouteDays = REROUTE_DAYS[preset.category] ?? 14;

  // ── Process each directly affected node ──────────────────────────────────
  for (const nodeId of preset.affectedNodeIds) {
    const node = nodeMap.get(nodeId);

    if (!node) {
      assumptions.push(
        `Node "${nodeId}" not found in graph — skipped; contribution treated as zero.`,
      );
      continue;
    }

    const capacityType = node.capacityType ?? "throughput";
    const severityFraction = preset.severityPct / 100;
    const severityFractionMin = preset.severityRange.min / 100;
    const severityFractionMax = preset.severityRange.max / 100;
    const hasCapacity = node.capacityMtpa !== undefined;
    const utilPct = node.baseUtilizationPct ?? 75;
    const flexFactor = node.flexibilityFactor ?? 0.40;
    const bufferDays = node.bufferDays ?? 5;

    let lockedVolumeMtpa: number | null;
    let spareCapacityMtpa: number | null;
    let effectiveSeverityPct: number;
    let rationale: string;

    // ── PRODUCTION NODE branch ──────────────────────────────────────────
    if (capacityType === "production_output") {
      // Formula: output loss = current_output × severity
      // No spare-capacity / rerouting logic — output loss IS the gap.
      const currentOutput = hasCapacity
        ? node.capacityMtpa! * (utilPct / 100)
        : 0;
      const outputLoss = currentOutput * severityFraction;

      lockedVolumeMtpa = outputLoss;
      spareCapacityMtpa = null;
      effectiveSeverityPct = preset.severityPct;
      totalLockedMtpa += outputLoss;

      rationale =
        `PRODUCTION NODE: output reduced by ${preset.severityPct}% severity. ` +
        `Current output ${currentOutput.toFixed(1)} Mtpa → loss ${outputLoss.toFixed(1)} Mtpa. ` +
        `No rerouting possible — entire loss is a direct supply gap. ` +
        `Buffer: ${bufferDays} days before downstream shortage manifests.`;

      assumptions.push(
        `"${node.label}" is a production node (capacityType=production_output): ` +
        `capacityMtpa (${node.capacityMtpa} Mtpa) is output capacity, not transit throughput. ` +
        `Supply gap = output loss directly; spare-capacity formula NOT applied.`,
      );

      // ETA contribution: production shortfall arrives after bufferDays
      etaWeightedSum    += bufferDays * outputLoss;
      etaWeightedSumMin += bufferDays * outputLoss * (severityFractionMin / Math.max(0.01, severityFraction));
      etaWeightedSumMax += bufferDays * outputLoss * (severityFractionMax / Math.max(0.01, severityFraction));
      etaWeightTotal    += outputLoss;

    // ── THROUGHPUT NODE branch ──────────────────────────────────────────
    } else {
      // Determine India-specific flow through this node
      let indiaFlowMtpa: number;
      if (node.type === "port") {
        // Port: compute ONLY the fraction of port traffic affected by the disrupted corridors.
        // A Suez closure affects Mundra's Suez-origin cargo (~22%), not all 155 Mtpa.
        // Find which disrupted corridor this port is being affected by.
        const activeCorridor = preset.affectedNodeIds.find(
          (id) => PORT_CORRIDOR_FRACTION[`${nodeId}:${id}`] !== undefined,
        );
        const portCorridorFrac = activeCorridor
          ? (PORT_CORRIDOR_FRACTION[`${nodeId}:${activeCorridor}`] ?? 0.20)
          : 0.20; // default conservative estimate

        indiaFlowMtpa = hasCapacity
          ? node.capacityMtpa! * (utilPct / 100) * portCorridorFrac
          : 0;

        if (!activeCorridor) {
          assumptions.push(
            `Port "${node.label}": no port-corridor fraction found for active corridors; ` +
            `defaulted to 20% of port traffic. ANALYST_ESTIMATE.`,
          );
        }
      } else if (node.type === "corridor") {
        const fraction = INDIA_CORRIDOR_FRACTION[nodeId] ?? 0.03;
        indiaFlowMtpa = hasCapacity
          ? node.capacityMtpa! * (utilPct / 100) * fraction
          : 0;
      } else {
        // infrastructure / other without production_output tag
        indiaFlowMtpa = hasCapacity ? node.capacityMtpa! * (utilPct / 100) : 0;
      }

      const affectedFlow = indiaFlowMtpa * severityFraction;

      // Route-family deduplication (corridors):
      const routeFamily = ROUTE_FAMILY[nodeId];
      const isCorridorDuplicate = routeFamily !== undefined && countedRouteFamilies.has(routeFamily);

      // Port deduplication: if upstream corridor is already being counted in
      // this preset's affectedNodeIds, the port contributes zero supply gap.
      const upstreamCorridor = PORT_UPSTREAM_CORRIDOR[nodeId];
      const isPortDuplicate =
        node.type === "port" &&
        upstreamCorridor !== undefined &&
        preset.affectedNodeIds.includes(upstreamCorridor);

      const isDuplicate = isCorridorDuplicate || isPortDuplicate;

      if (isDuplicate) {
        lockedVolumeMtpa = 0;
        spareCapacityMtpa = null;
        effectiveSeverityPct = preset.severityPct;

        rationale =
          isPortDuplicate
          ? `Port supply gap zeroed: upstream corridor (${upstreamCorridor}) already counted in this preset's affected nodes. Port contributes ETA and industry impact only.`
          : `Route-family duplicate (family: "${routeFamily}"): ETA and cost effects captured; ` +
            `supply gap zeroed to prevent double-counting with primary node in same family.`;
      } else {
        if (routeFamily) countedRouteFamilies.add(routeFamily);

        lockedVolumeMtpa = affectedFlow * (1 - flexFactor);
        totalLockedMtpa += lockedVolumeMtpa;

        // Spare capacity on this node after disruption
        if (hasCapacity) {
          const postDisruptionCapacity = node.capacityMtpa! * (1 - severityFraction);
          const normalFlow = indiaFlowMtpa;
          spareCapacityMtpa = Math.max(0, postDisruptionCapacity - normalFlow * (1 - severityFraction));
        } else {
          spareCapacityMtpa = null;
          assumptions.push(
            `"${node.label}" has no capacityMtpa — spare capacity check skipped; ` +
            `rerouted volume treated as unconstrained (optimistic assumption).`,
          );
        }

        effectiveSeverityPct = preset.severityPct;

        rationale =
          `${node.type === "corridor" ? "Corridor" : "Port"} throughput reduced ${preset.severityPct}%. ` +
          `India flow: ${indiaFlowMtpa.toFixed(1)} Mtpa. ` +
          `After disruption: ${affectedFlow.toFixed(1)} Mtpa affected; ` +
          `${(flexFactor * 100).toFixed(0)}% reroutable → ` +
          `${(affectedFlow * flexFactor).toFixed(1)} Mtpa rerouted, ` +
          `${lockedVolumeMtpa.toFixed(1)} Mtpa locked (supply gap). ` +
          (spareCapacityMtpa !== null
            ? `Spare capacity post-disruption: ${spareCapacityMtpa.toFixed(1)} Mtpa.`
            : "Spare capacity: unknown (no capacity annotation).");
      }

      // ETA shift contribution for this node
      // Weighted average: (1-flex) fraction waits; flex fraction reroutes via Cape
      const waitDays    = preset.expectedDurationDays;
      const weight      = indiaFlowMtpa * severityFraction;
      const etaLikely   = (1 - flexFactor) * waitDays + flexFactor * rerouteDays;
      const etaMin      = (1 - flexFactor) * preset.durationRange.min + flexFactor * (rerouteDays * 0.7);
      const etaMax      = (1 - flexFactor) * preset.durationRange.max + flexFactor * (rerouteDays * 1.3);

      etaWeightedSum    += etaLikely * weight;
      etaWeightedSumMin += etaMin    * weight;
      etaWeightedSumMax += etaMax    * weight;
      etaWeightTotal    += weight;
    }

    nodeImpacts.push({
      nodeId,
      nodeLabel: node.label,
      nodeType: node.type as CorridorImpactResult["nodeType"],
      effectiveSeverityPct,
      spareCapacityMtpa,
      lockedVolumeMtpa,
      lagDays: bufferDays,
      rationale,
    });
  }

  // ── Apply decision levers ────────────────────────────────────────────────

  for (const lever of levers) {
    // Spot charter: source volume via alternative corridor, reducing locked gap
    if (lever.type === "spot_charter") {
      const charter = lever as SpotCharterLever;
      // Find the primary affected corridor for this product and reduce locked volume
      const primaryImpact = nodeImpacts.find(
        (n) =>
          n.lockedVolumeMtpa !== null &&
          n.lockedVolumeMtpa > 0 &&
          n.nodeType === "corridor",
      );
      if (primaryImpact && primaryImpact.lockedVolumeMtpa !== null) {
        const relief = Math.min(charter.volumeMtpa, primaryImpact.lockedVolumeMtpa);
        primaryImpact.lockedVolumeMtpa = Math.max(0, primaryImpact.lockedVolumeMtpa - relief);
        totalLockedMtpa = Math.max(0, totalLockedMtpa - relief);
        primaryImpact.rationale +=
          ` | Spot charter (${charter.volumeMtpa.toFixed(1)} Mtpa via ${charter.alternativeCorridorId}): ${relief.toFixed(1)} Mtpa gap relieved.`;
      }
    }

    // Supplier switch: reduces locked volume proportionally
    if (lever.type === "supplier_switch") {
      const switchLever = lever;
      const reduction = Math.min(switchLever.volumeMtpa, totalLockedMtpa);
      totalLockedMtpa = Math.max(0, totalLockedMtpa - reduction);
      assumptions.push(
        `Supplier switch (${switchLever.fromCountryId} → ${switchLever.toCountryId}, ` +
        `${switchLever.volumeMtpa.toFixed(1)} Mtpa): new supplier assumed to have available ` +
        `uncommitted volume. Lead-time for new contracts not modelled (v1 simplification).`,
      );
    }
  }

  // ── Compute ETA shift (weighted across all affected nodes) ──────────────
  const etaLikely = etaWeightTotal > 0 ? etaWeightedSum    / etaWeightTotal : preset.expectedDurationDays;
  const etaMin    = etaWeightTotal > 0 ? etaWeightedSumMin / etaWeightTotal : preset.durationRange.min;
  const etaMax    = etaWeightTotal > 0 ? etaWeightedSumMax / etaWeightTotal : preset.durationRange.max;

  const etaShiftDays: RangeEstimate = {
    min:    Math.round(Math.max(0, etaMin)    * 10) / 10,
    likely: Math.round(Math.max(0, etaLikely) * 10) / 10,
    max:    Math.round(Math.max(0, etaMax)    * 10) / 10,
    unit: "days",
  };

  // ── Compute reserve drawdown from levers ────────────────────────────────
  const reserve = computeReserveDrawdown(levers, reserveConfig);

  if (reserve.isActive) {
    if (reserve.cappedByRateLimit) {
      assumptions.push(
        `Strategic reserve release capped from ${reserve.requestedDailyRateMtpa.toFixed(4)} to ` +
        `${reserve.effectiveDailyRateMtpa.toFixed(4)} Mtpa/day (SPR injection rate ceiling).`,
      );
    }
    if (reserve.cappedByFloor) {
      assumptions.push(
        `Reserve would hit policy floor (${reserveConfig.minReserveFloorDays} days) at day ${reserve.daysToFloor?.toFixed(1)}; ` +
        `drawdown halts at that point — reserves NOT simulated to zero.`,
      );
    }
  }

  // ── Compute full metrics surface ─────────────────────────────────────────
  const metrics = computeMetrics({
    totalLockedMtpa,
    etaShiftDays,
    nodeImpacts,
    preset,
    levers,
    reserve,
    ssiWeights,
    reserveConfig,
    assumptions,
  });

  return {
    presetId: preset.id,
    appliedLevers: levers,
    computedAt: new Date().toISOString(),
    nodeImpacts,
    metrics,
  };
}
