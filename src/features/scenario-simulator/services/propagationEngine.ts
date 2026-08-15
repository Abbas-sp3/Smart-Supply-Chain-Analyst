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
  type KnowledgeGraphNode,
} from "../../geopolitical-intelligence/knowledge-graph/tradeGraph";
import type {
  CorridorImpactResult,
  DecisionLever,
  PropagationResult,
  RangeEstimate,
  SpotCharterLever,
  SsiWeights,
} from "../types";
import type { DisruptionPreset } from "../types";
import { DEFAULT_SSI_WEIGHTS, type ReserveConfig } from "../constants/reserve-config";
import { computeReserveDrawdown } from "./reserveService";
import { computeMetrics } from "./metricsService";
import { CountryProfile } from "@/data/countries/types";
import { indiaProfile } from "@/data/countries/india";

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



export function runPropagation(
  preset: DisruptionPreset,
  levers: DecisionLever[],
  country: CountryProfile = indiaProfile,
  ssiWeights: SsiWeights = DEFAULT_SSI_WEIGHTS,
): PropagationResult {

  const nodeMap = new Map<string, KnowledgeGraphNode>(
    country.tradeGraph.map((n) => [n.id, n]),
  );

  const assumptions: string[] = [
    "Alternative-route capacity assumes no competing demand from other global buyers.",
    "Corridor flow fractions are analyst estimates: Hormuz 22%, Suez 5%, Malacca 6%, Red Sea 8%, Black Sea 15%, South China Sea 4%, Cape of Good Hope 4%.",
    "Sequential corridors on one physical route (e.g. Suez and Bab-el-Mandeb) are deduplicated for supply-gap counting; each still contributes independently to ETA and cost.",
    "Spot-charter vessels are assumed available on demand; vessel-procurement lead time is not included.",
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
        `Node "${nodeId}" is not present in the trade graph and has been skipped; its contribution is treated as zero.`,
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
        `"${node.label}" is a production node: capacityMtpa (${node.capacityMtpa} Mtpa) represents output capacity, not transit throughput. Supply gap equals output loss; spare-capacity rerouting does not apply.`,
      );

      // ETA contribution: production shortfall arrives after bufferDays
      etaWeightedSum    += bufferDays * outputLoss;
      etaWeightedSumMin += bufferDays * outputLoss * (severityFractionMin / Math.max(0.01, severityFraction));
      etaWeightedSumMax += bufferDays * outputLoss * (severityFractionMax / Math.max(0.01, severityFraction));
      etaWeightTotal    += outputLoss;

    // ── THROUGHPUT NODE branch ──────────────────────────────────────────
    } else {
      let countryFlowMtpa: number;
      if (node.type === "port") {
        // Port: compute ONLY the fraction of port traffic affected by the disrupted corridors.
        const activeCorridor = preset.affectedNodeIds.find(
          (id) => country.portCorridorFractions[`${nodeId}:${id}`] !== undefined,
        );
        const portCorridorFrac = activeCorridor
          ? (country.portCorridorFractions[`${nodeId}:${activeCorridor}`] ?? 0.20)
          : 0.20; // default conservative estimate

        countryFlowMtpa = hasCapacity
          ? node.capacityMtpa! * (utilPct / 100) * portCorridorFrac
          : 0;

        if (!activeCorridor) {
          assumptions.push(
            `Port "${node.label}": no port-corridor fraction on file for active corridors; corridor-specific traffic share defaulted to 20% of total port throughput.`,
          );
        }
      } else if (node.type === "corridor") {
        const fraction = country.corridorFractions[nodeId] ?? 0.03;
        countryFlowMtpa = hasCapacity
          ? node.capacityMtpa! * (utilPct / 100) * fraction
          : 0;
      } else {
        // infrastructure / other without production_output tag
        countryFlowMtpa = hasCapacity ? node.capacityMtpa! * (utilPct / 100) : 0;
      }

      const affectedFlow = countryFlowMtpa * severityFraction;

      // Route-family deduplication (corridors):
      const routeFamily = ROUTE_FAMILY[nodeId];
      const isCorridorDuplicate = routeFamily !== undefined && countedRouteFamilies.has(routeFamily);

      // Port deduplication: if upstream corridor is already being counted in
      // this preset's affectedNodeIds, the port contributes zero supply gap.
      // We check if any of the affected corridors is mapped as feeding this port.
      let isPortDuplicate = false;
      let matchedCorridor = "";
      if (node.type === "port") {
        for (const id of preset.affectedNodeIds) {
          if (country.portCorridorFractions[`${nodeId}:${id}`] !== undefined) {
            isPortDuplicate = true;
            matchedCorridor = id;
            break;
          }
        }
      }

      const isDuplicate = isCorridorDuplicate || isPortDuplicate;

      if (isDuplicate) {
        lockedVolumeMtpa = 0;
        effectiveSeverityPct = 0;
        spareCapacityMtpa = null;

        rationale =
          isPortDuplicate
          ? `Port supply gap zeroed: upstream corridor (${matchedCorridor}) already counted in this preset's affected nodes. Port contributes ETA and industry impact only.`
          : `Route-family duplicate (family: "${routeFamily}"): ETA and cost effects captured; ` +
            `supply gap zeroed to prevent double-counting with primary node in same family.`;
      } else {
        if (routeFamily) countedRouteFamilies.add(routeFamily);

        lockedVolumeMtpa = affectedFlow * (1 - flexFactor);
        totalLockedMtpa += lockedVolumeMtpa;

        // Spare capacity on this node after disruption
        if (hasCapacity) {
          const postDisruptionCapacity = node.capacityMtpa! * (1 - severityFraction);
          const normalFlow = countryFlowMtpa;
          spareCapacityMtpa = Math.max(0, postDisruptionCapacity - normalFlow * (1 - severityFraction));
        } else {
          spareCapacityMtpa = null;
          assumptions.push(
            `"${node.label}" has no capacity annotation; spare-capacity check skipped and rerouted volume is treated as unconstrained.`,
          );
        }

        effectiveSeverityPct = countryFlowMtpa > 0 
          ? Math.round((lockedVolumeMtpa / countryFlowMtpa) * 100)
          : preset.severityPct;

        rationale =
          `${node.type === "corridor" ? "Corridor" : "Port"} throughput reduced ${preset.severityPct}%. ` +
          `Country flow: ${countryFlowMtpa.toFixed(1)} Mtpa. ` +
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
      const weight      = countryFlowMtpa * severityFraction;
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
        `${switchLever.volumeMtpa.toFixed(1)} Mtpa): alternate supplier assumed to hold sufficient uncommitted volume. Contract lead time is not included in the ETA calculation.`,
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
  const reserve = computeReserveDrawdown(
    levers,
    country.reserveConfig,
  );

  if (reserve.isActive) {
    if (reserve.cappedByRateLimit) {
      assumptions.push(
        `Strategic reserve release: requested rate (${reserve.requestedDailyRateMtpa.toFixed(4)} Mtpa/day) exceeds SPR injection capacity; capped to ${reserve.effectiveDailyRateMtpa.toFixed(4)} Mtpa/day.`,
      );
    }
    if (reserve.cappedByFloor) {
      assumptions.push(
        `Reserve drawdown halts at day ${reserve.daysToFloor?.toFixed(1)}, when the policy floor of ${country.reserveConfig.minReserveFloorDays} days cover is reached. Reserves are not simulated below that level.`,
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
    reserveConfig: country.reserveConfig,
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
