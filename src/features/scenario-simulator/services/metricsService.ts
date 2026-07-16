/**
 * Metrics Computation Service
 *
 * Produces a MetricsSurface from propagation engine outputs.
 * Receives pre-computed ETA shift from the engine (which has node-level
 * flexibility data) — metricsService never re-derives inputs it wasn't given.
 *
 * Triangular distribution model:
 *   Every output has a (min, likely, max) triple.
 *   min  ← computed at severityRange.min
 *   likely ← computed at preset.severityPct
 *   max  ← computed at severityRange.max × durationRange.max scale factor
 *
 * SSI composite (0–100):
 *   Each driver is normalised 0→1 (0 = worst) then weighted per SsiWeights.
 *   Score = 100 - (weighted_badness × 100). Clamped [0, 100].
 */

import type {
  CorridorImpactResult,
  DecisionLever,
  MetricsSurface,
  RangeEstimate,
  SsiWeights,
  StrategicReserveReleaseLever,
} from "../types";
import type { DisruptionPreset } from "../types";
import {
  DEFAULT_SSI_WEIGHTS,
  computeInsurancePremiumBps,
  INDIA_RESERVE_CONFIG,
  type ReserveConfig,
} from "../constants/reserve-config";
import type { ReserveDrawdownResult } from "./reserveService";

// ─── Helpers ────────────────────────────────────────────────────────────────

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function tri(min: number, likely: number, max: number, unit: string): RangeEstimate {
  return { min: r2(min), likely: r2(likely), max: r2(max), unit };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Normalisation ceilings (values above these = worst-case SSI input) ─────
// These are calibration constants, not hard physical limits.
const SSI_NORM = {
  supplyGapMtpa: 350,          // Raised from 200 to 350 to ensure worst-case gaps (e.g. 250+ Mtpa) don't hard clamp, keeping SSI responsive to levers.
  etaShiftDays: 60,            // 60-day delay = near-total route closure
  reserveFloorDays: 20,        // floor threshold (matches minReserveFloorDays)
  freightIndexRise: 300,       // freight rising 300 pts above 100 baseline = extreme
};

// ─── Main ────────────────────────────────────────────────────────────────────

export type MetricsInput = {
  /** Sum of lockedVolumeMtpa across all corridor/port impact nodes (Mtpa, annualised). */
  totalLockedMtpa: number;
  /** Pre-computed ETA shift ranges from propagationEngine (has node flexibility data). */
  etaShiftDays: RangeEstimate;
  nodeImpacts: CorridorImpactResult[];
  preset: DisruptionPreset;
  levers: DecisionLever[];
  reserve: ReserveDrawdownResult;
  ssiWeights?: SsiWeights;
  reserveConfig?: ReserveConfig;
  assumptions: string[];
};

export function computeMetrics({
  totalLockedMtpa,
  etaShiftDays,
  nodeImpacts,
  preset,
  levers,
  reserve,
  ssiWeights = DEFAULT_SSI_WEIGHTS,
  reserveConfig = INDIA_RESERVE_CONFIG,
  assumptions,
}: MetricsInput): MetricsSurface {

  // ── Supply gap (Mtpa annualised, after reserve relief) ──────────────────
  const reliefMtpa = reserve.annualisedReliefMtpa;
  const gapLikely   = Math.max(0, totalLockedMtpa - reliefMtpa);
  // Scale min/max by severity ratio relative to likely
  const sevLikely = preset.severityPct;
  const sevMin    = preset.severityRange.min;
  const sevMax    = preset.severityRange.max;
  const gapMin    = Math.max(0, gapLikely * (sevMin  / Math.max(1, sevLikely)));
  const gapMax    = Math.max(0, gapLikely * (sevMax  / Math.max(1, sevLikely)));
  const supplyGapMtpa = tri(gapMin, gapLikely, gapMax, "Mtpa");

  // ── Landed cost delta (USD/bbl or USD/MT) ───────────────────────────────
  // Freight penalty + insurance + oil price elasticity
  const BASE_OIL_USD_BBL = 85;
  const freightPremiumFraction = preset.spotFreightPenaltyPct / 100;
  const costLikely = BASE_OIL_USD_BBL * freightPremiumFraction * (sevLikely / 100);
  const costMin    = costLikely * (sevMin / Math.max(1, sevLikely)) * 0.6;
  const costMax    = costLikely * (sevMax / Math.max(1, sevLikely)) * 1.8;
  const landedCostDeltaPerUnit = tri(costMin, costLikely, costMax, "USD/bbl");

  // ── Freight rate index (100 = baseline) ────────────────────────────────
  const freightLikely = 100 + preset.spotFreightPenaltyPct * (sevLikely / 100);
  const freightMin    = 100 + preset.spotFreightPenaltyPct * (sevMin / 200);
  const freightMax    = 100 + preset.spotFreightPenaltyPct * (sevMax / 80);
  const freightRateIndex = tri(freightMin, freightLikely, freightMax, "index (100=baseline)");

  // ── Insurance premium (bps) ────────────────────────────────────────────
  // Use midpoint of event duration for the "typical" premium snapshot
  const midDay = preset.expectedDurationDays / 2;
  const insPeakBps = preset.insurancePremiumPeakBps;
  const insLikely  = computeInsurancePremiumBps(midDay, preset.expectedDurationDays, insPeakBps, preset.premiumDecayModel);
  const insMin     = r2(insLikely * 0.25);
  const insMax     = insPeakBps;
  const insurancePremiumBps = tri(insMin, insLikely, insMax, "bps");

  // ── Reserve depletion ─────────────────────────────────────────────────
  // Calculate how fast the supply gap is burning through national deployable reserves.
  // This is NOT constrained by the SPR maxDailyDrawdownMtpa, because commercial reserves
  // (which form the bulk of the cover) are co-located at refineries and drawn directly.
  let reserveDepletionDaysToFloor: number | null = null;
  if (gapLikely > 0) {
    const dailyConsumptionMtpa = reserveConfig.normalConsumptionMtpa / 365;
    const currentVolumeMtpa = reserveConfig.totalReserveDays * dailyConsumptionMtpa;
    const floorVolumeMtpa = reserveConfig.minReserveFloorDays * dailyConsumptionMtpa;
    const deployableVolumeMtpa = Math.max(0, currentVolumeMtpa - floorVolumeMtpa);
    
    const dailyGapMtpa = gapLikely / 365;
    reserveDepletionDaysToFloor = deployableVolumeMtpa / dailyGapMtpa;
  }

  // ── Industry output risk ──────────────────────────────────────────────
  // Downstream industry nodes in nodeImpacts get an output risk proportional
  // to their effective severity and whether their bufferDays has been exceeded.
  const industryOutputRiskPct: Record<string, RangeEstimate> = {};
  for (const impact of nodeImpacts) {
    if (impact.nodeType === "industry" || impact.nodeType === "infrastructure") {
      const riskLikely = impact.effectiveSeverityPct;
      industryOutputRiskPct[impact.nodeId] = tri(
        clamp(riskLikely * 0.25, 0, 100),
        clamp(riskLikely, 0, 100),
        clamp(riskLikely * 1.4, 0, 100),
        "percent",
      );
    }
  }

  // ── SSI composite ─────────────────────────────────────────────────────
  // Normalise each driver to [0, 1] where 1 = worst possible
  const normGap = clamp(gapLikely / SSI_NORM.supplyGapMtpa, 0, 1);
  const normEta = clamp(etaShiftDays.likely / SSI_NORM.etaShiftDays, 0, 1);

  let normReserve = 0;
  if (reserve.isActive && reserve.daysToFloor !== null) {
    // Closer to floor → higher risk → higher normReserve
    normReserve = clamp(
      SSI_NORM.reserveFloorDays / Math.max(1, reserve.daysToFloor),
      0, 1,
    );
  }

  const normFreight = clamp(
    (freightLikely - 100) / SSI_NORM.freightIndexRise,
    0, 1,
  );

  const weightedBadness =
    normGap      * ssiWeights.supplyGapVolume +
    normEta      * ssiWeights.etaShift +
    normReserve  * ssiWeights.reserveTrajectory +
    normFreight  * ssiWeights.freightAndInsuranceCost;

  const supplySecurityIndex = clamp(
    Math.round(100 - weightedBadness * 100),
    0, 100,
  );

  // ── Reserve clip info ─────────────────────────────────────────────────
  // Surface explicit "requested Xd, sustained Yd" when the floor clips the lever.
  let reserveClipInfo: MetricsSurface["reserveClipInfo"] = null;
  if (reserve.isActive) {
    const sprlever = levers.find(
      (l): l is StrategicReserveReleaseLever =>
        l.type === "strategic_reserve_release",
    );
    if (sprlever) {
      const sustainedDays =
        reserve.cappedByFloor && reserve.daysToFloor !== null
          ? Math.min(reserve.daysToFloor, sprlever.durationDays)
          : sprlever.durationDays;
      reserveClipInfo = {
        requestedDays: sprlever.durationDays,
        sustainedDays: Math.round(sustainedDays * 10) / 10,
        clippedByFloor: reserve.cappedByFloor,
        clippedByRateLimit: reserve.cappedByRateLimit,
      };
    }
  }

  return {
    landedCostDeltaPerUnit,
    etaShiftDays,
    supplyGapMtpa,
    reserveDepletionDaysToFloor,
    reserveClipInfo,
    freightRateIndex,
    insurancePremiumBps,
    industryOutputRiskPct,
    supplySecurityIndex,
    ssiWeightsUsed: ssiWeights,
    assumptions,
  };
}
