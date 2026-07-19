import { INDIA_RESERVE_CONFIG, type ReserveConfig } from "@/features/scenario-simulator/constants/reserve-config";
import type { PropagationResult } from "@/features/scenario-simulator/types";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { INDIA_TRADE_GRAPH } from "@/features/geopolitical-intelligence/knowledge-graph/indiaTradeGraph";

export type OptimizationRecommendation = {
  /** The core Yes/No decision */
  recommendRelease: boolean;
  /** Gap that needs filling (Mtpa) */
  supplyGapMtpa: number;
  /** Expected duration of the disruption */
  durationDays: number;
  /** Recommended daily drawdown rate (Mtpa/day) */
  recommendedDailyRateMtpa: number;
  /** Capped daily rate based on physical limits */
  effectiveDailyRateMtpa: number;
  /** Days reserve can sustain this rate before hitting policy floor */
  daysToFloor: number;
  /** Whether the effective rate is capped by maxDailyDrawdownMtpa */
  cappedByRateLimit: boolean;
  /** Whether the release would breach the floor before duration ends */
  breachesFloor: boolean;
  /** Total volume projected to be deployed (MMT) */
  totalVolumeDeployedMMT: number;
  /** Sorted list of refineries prioritized for supply */
  prioritizedRefineries: {
    nodeId: string;
    name: string;
    lockedVolumeMtpa: number;
  }[];
  /** Step-by-step reasoning for disclosure */
  reasoning: string[];
};

export function generateOptimizationStrategy(
  result: PropagationResult,
  config: ReserveConfig = INDIA_RESERVE_CONFIG
): OptimizationRecommendation {
  const reasoning: string[] = [];
  const gapMtpa = result.metrics.supplyGapMtpa.likely;
  
  const preset = DISRUPTION_PRESETS.find((p) => p.id === result.presetId);
  const durationDays = preset?.expectedDurationDays ?? 30; // fallback if not found

  // Calculate volume needed over the disruption duration (MMT)
  const totalVolumeNeededMMT = gapMtpa * (durationDays / 365);

  // ── RELEASE TRIGGER THRESHOLDS ─────────────────────────────────────────────
  // IMPORTANT: These thresholds are ILLUSTRATIVE POLICY PARAMETERS, not derived
  // from official Indian energy security doctrine, IEA guidelines, or any
  // government-published trigger rule. They were chosen to approximate
  // a plausible decision boundary between "use commercial buffer" and
  // "tap the SPR" — but the correct values depend on political risk tolerance,
  // OMC stock levels on the day, and government policy at the time.
  // Treat these as a starting point for calibration, not established policy.
  // Source: same honest-assumption pattern used for SSI weights, recovery ramps, etc.
  // ─────────────────────────────────────────────────────────────────────────────
  const commercialBufferMMT = 31.8; // ~45 days OMC cover at normal consumption (PPAC estimate)
  // Threshold 1 — Severe shock: gap exceeds 30% of annualized normal consumption
  const severeShockThreshold = config.normalConsumptionMtpa * 0.30; // illustrative: 30% of consumption
  // Threshold 2 — Sustained drain: total volume needed > 15% of commercial buffer
  const bufferDrainThreshold = commercialBufferMMT * 0.15; // illustrative: 15% of OMC stocks

  let recommendRelease = false;
  let triggerReason = "";

  if (gapMtpa > severeShockThreshold) {
    recommendRelease = true;
    triggerReason = `Severe shock detected: Supply gap (${gapMtpa.toFixed(2)} MMTPA) exceeds 30% of national consumption (illustrative threshold — not official policy).`;
  } else if (totalVolumeNeededMMT > bufferDrainThreshold) {
    recommendRelease = true;
    triggerReason = `Buffer drain detected: Required volume (${totalVolumeNeededMMT.toFixed(2)} MMT over ${durationDays} days) exceeds 15% of estimated OMC commercial stocks (illustrative threshold — not official policy).`;
  } else if (gapMtpa > 0) {
    triggerReason = `Supply gap (${gapMtpa.toFixed(2)} MMTPA) over ${durationDays} days requires ${totalVolumeNeededMMT.toFixed(2)} MMT — within estimated OMC commercial buffer capacity (~${commercialBufferMMT} MMT). Preserve SPR reserves. Note: release thresholds are illustrative parameters, not official policy.`;
  } else {
    triggerReason = `No supply gap detected.`;
  }

  reasoning.push(triggerReason);

  // Calculate rate required to cover the gap
  // MMTPA is million metric tonnes per annum. Daily rate to cover it = MMTPA / 365
  const requiredDailyRate = gapMtpa / 365;
  let effectiveDailyRate = requiredDailyRate;
  let cappedByRateLimit = false;

  if (recommendRelease) {
    if (requiredDailyRate > config.maxDailyDrawdownMtpa) {
      effectiveDailyRate = config.maxDailyDrawdownMtpa;
      cappedByRateLimit = true;
      reasoning.push(`Target relief rate of ${(requiredDailyRate * 1000).toFixed(0)} kMT/day far exceeds India's physical SPR injection capacity of ${(config.maxDailyDrawdownMtpa * 1000).toFixed(1)} kMT/day. Drawdown recommendation is strictly capped at maximum deployable rate.`);
    } else {
      reasoning.push(`Required daily rate of ${(requiredDailyRate * 1000).toFixed(0)} kMT/day is within physical limits.`);
    }
  } else {
    // Zero out effective rate if NO release
    effectiveDailyRate = 0;
  }

  // Calculate deployable volume
  const dailyConsumption = config.normalConsumptionMtpa / 365;
  const currentVol = config.totalReserveDays * dailyConsumption;
  const floorVol = config.minReserveFloorDays * dailyConsumption;
  const deployableVol = Math.max(0, currentVol - floorVol);

  // Check if we hit floor before duration ends
  const daysToFloor = effectiveDailyRate > 0 ? deployableVol / effectiveDailyRate : Infinity;
  const breachesFloor = daysToFloor < durationDays;
  
  let totalVolumeDeployedMMT = 0;
  if (recommendRelease) {
    if (breachesFloor) {
      reasoning.push(`Warning: Sustaining this rate for ${durationDays} days would breach the ${config.minReserveFloorDays}-day strategic minimum policy floor. Intervention will be required after ${Math.floor(daysToFloor)} days.`);
      totalVolumeDeployedMMT = deployableVol; // Can only deploy up to the floor
    } else {
      reasoning.push(`Reserve maintains minimum policy floor of ${config.minReserveFloorDays} days for the full expected duration.`);
      totalVolumeDeployedMMT = effectiveDailyRate * durationDays;
    }
  }

  // Prioritize refineries based on locked volume
  const refineryImpacts = result.nodeImpacts
    .filter((impact) => {
      // Find node in graph
      const node = INDIA_TRADE_GRAPH.find((n: any) => n.id === impact.nodeId);
      return impact.nodeId.includes("refinery") && impact.lockedVolumeMtpa !== null && impact.lockedVolumeMtpa > 0;
    })
    .map((impact) => {
      const node = INDIA_TRADE_GRAPH.find((n: any) => n.id === impact.nodeId);
      return {
        nodeId: impact.nodeId,
        name: node?.label ?? impact.nodeId,
        lockedVolumeMtpa: impact.lockedVolumeMtpa!,
      };
    })
    .sort((a, b) => b.lockedVolumeMtpa - a.lockedVolumeMtpa);

  if (recommendRelease && refineryImpacts.length > 0) {
    reasoning.push(`Prioritized ${refineryImpacts.length} refineries based on inflexible (locked) supply volume dependency.`);
  }

  return {
    recommendRelease,
    supplyGapMtpa: gapMtpa,
    durationDays,
    recommendedDailyRateMtpa: requiredDailyRate,
    effectiveDailyRateMtpa: effectiveDailyRate,
    daysToFloor,
    cappedByRateLimit,
    breachesFloor,
    totalVolumeDeployedMMT,
    prioritizedRefineries: refineryImpacts,
    reasoning,
  };
}
