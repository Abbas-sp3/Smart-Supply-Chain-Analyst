import type { PropagationResult } from "@/features/scenario-simulator/types";
import { CountryProfile } from "@/data/countries/types";
import { indiaProfile } from "@/data/countries/india";

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
  /** Estimated days to refill the drawn down volume post-disruption */
  estimatedReplenishmentDays: number;
  /** Sorted list of refineries prioritized for supply */
  prioritizedRefineries: {
    nodeId: string;
    name: string;
    lockedVolumeMtpa: number;
    sharePct?: string;
  }[];
  /** Step-by-step reasoning for disclosure */
  reasoning: string[];
};

export function generateOptimizationStrategy(
  result: PropagationResult,
  country: CountryProfile = indiaProfile
): OptimizationRecommendation {
  const reasoning: string[] = [];
  const gapMtpa = result.metrics.supplyGapMtpa.likely;
  const config = country.reserveConfig;
  
  const preset = country.disruptionPresets?.find((p) => p.id === result.presetId);
  const durationDays = preset?.expectedDurationDays ?? 30; // fallback if not found

  // Calculate volume needed over the disruption duration (MMT)
  const totalVolumeNeededMMT = gapMtpa * (durationDays / 365);

  const commercialBufferMMT = country.commercialBufferMmt; 
  // Threshold 1 — Severe shock: gap exceeds 30% of annualized normal consumption
  const severeShockThreshold = config.normalConsumptionMtpa * 0.30;
  // Threshold 2 — Sustained drain: total volume needed > 15% of commercial buffer
  const bufferDrainThreshold = commercialBufferMMT * 0.15;

  let recommendRelease = false;
  let triggerReason = "";

  const isMandated = country.reserveMechanism.type === "mandated_stockholding";
  const bufferLabel = isMandated ? "industry-held commercial stocks" : "OMC commercial stocks";
  const sprLabel = isMandated ? "mandated emergency stocks" : "Strategic Petroleum Reserve (SPR)";

  if (gapMtpa > severeShockThreshold) {
    recommendRelease = true;
    triggerReason = `Severe shock detected: Systemic crude supply gap (${gapMtpa.toFixed(2)} MMTPA) exceeds 30% of national annual consumption. Immediate strategic stock release recommended.`;
  } else if (totalVolumeNeededMMT > bufferDrainThreshold) {
    recommendRelease = true;
    triggerReason = `Buffer drain detected: Cumulative volume needed (${totalVolumeNeededMMT.toFixed(2)} MMT over ${durationDays} days) exceeds 15% of estimated ${bufferLabel} (~${commercialBufferMMT} MMT). Emergency drawdown activated.`;
  } else if (gapMtpa > 0) {
    // If there is any notable gap over 5 Mtpa, trigger proactive partial stabilization release
    if (gapMtpa > 5) {
      recommendRelease = true;
      triggerReason = `Moderate supply gap detected (${gapMtpa.toFixed(2)} MMTPA). Strategic buffer release initiated to stabilize domestic refinery throughput and curb fuel inflation.`;
    } else {
      triggerReason = `Supply gap (${gapMtpa.toFixed(2)} MMTPA) over ${durationDays} days requires ${totalVolumeNeededMMT.toFixed(2)} MMT — within standard operational ${bufferLabel} capacity. Conserve ${sprLabel}.`;
    }
  } else {
    triggerReason = `No supply gap detected. Normal operating levels maintained.`;
  }

  reasoning.push(triggerReason);

  // Calculate rate required to cover the gap
  // MMTPA is million metric tonnes per annum. Daily rate to cover it = MMTPA / 365
  const requiredDailyRate = gapMtpa / 365;
  let effectiveDailyRate = requiredDailyRate;
  let cappedByRateLimit = false;

  if (recommendRelease && gapMtpa > 0) {
    if (requiredDailyRate > config.maxDailyDrawdownMtpa) {
      effectiveDailyRate = config.maxDailyDrawdownMtpa;
      cappedByRateLimit = true;
      reasoning.push(`Target relief rate of ${(requiredDailyRate * 1000).toFixed(0)} kMT/day exceeds maximum pipeline injection ceiling of ${(config.maxDailyDrawdownMtpa * 1000).toFixed(1)} kMT/day. Drawdown is capped at physical max rate.`);
    } else {
      reasoning.push(`Required daily drawdown rate of ${(requiredDailyRate * 1000).toFixed(0)} kMT/day is within physical distribution capacity.`);
    }
  } else {
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
  if (recommendRelease && effectiveDailyRate > 0) {
    if (breachesFloor) {
      reasoning.push(`Warning: Sustaining this drawdown rate for ${durationDays} days would breach the ${config.minReserveFloorDays}-day strategic policy floor after ${Math.floor(daysToFloor)} days.`);
      totalVolumeDeployedMMT = deployableVol;
    } else {
      reasoning.push(`Strategic reserve maintains minimum policy floor of ${config.minReserveFloorDays} days for the full duration.`);
      totalVolumeDeployedMMT = effectiveDailyRate * durationDays;
    }
  }

  // ── Prioritize infrastructure/refinery nodes based on locked volume ──────────
  let refineryImpacts: {
    nodeId: string;
    name: string;
    lockedVolumeMtpa: number;
    sharePct?: string;
  }[] = result.nodeImpacts
    .filter((impact) => {
      const isRefineryInfra = impact.nodeId.startsWith("infra_refin") || impact.nodeId.includes("refinery");
      return isRefineryInfra && impact.lockedVolumeMtpa !== null && impact.lockedVolumeMtpa > 0;
    })
    .map((impact) => {
      const node = country.tradeGraph.find((n: any) => n.id === impact.nodeId);
      const fallbackLabel = impact.nodeId
        .replace(/^infra_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        nodeId: impact.nodeId,
        name: node?.label ?? fallbackLabel,
        lockedVolumeMtpa: impact.lockedVolumeMtpa!,
      };
    });

  // Fallback: If preset affected corridors/ports directly but did not list refinery nodes explicitly,
  // distribute the systemic supply gap across the country's refineries based on their capacity share!
  if (refineryImpacts.length === 0 && gapMtpa > 0) {
    const refineryNodes = country.tradeGraph.filter((n: any) => 
      n.id.startsWith("infra_refin") || n.id.includes("refinery") || n.type === "infrastructure"
    );

    if (refineryNodes.length > 0) {
      const totalRefineryCap = refineryNodes.reduce((acc: number, n: any) => acc + (n.capacityMtpa ?? 30), 0);
      refineryImpacts = refineryNodes.map((n: any) => {
        const cap = n.capacityMtpa ?? 30;
        const share = totalRefineryCap > 0 ? cap / totalRefineryCap : 1 / refineryNodes.length;
        const lockedVol = gapMtpa * share;
        return {
          nodeId: n.id,
          name: n.label,
          lockedVolumeMtpa: lockedVol,
          sharePct: `${Math.round(share * 100)}%`,
        };
      });
    } else {
      // Default fallback for Singapore if trade graph doesn't tag
      if (country.id === "singapore") {
        refineryImpacts = [
          { nodeId: "infra_refinery_jurong", name: "Jurong Island Refineries (ExxonMobil & SRC)", lockedVolumeMtpa: gapMtpa * 0.64, sharePct: "64%" },
          { nodeId: "infra_refinery_bukom", name: "Pulau Bukom Refinery (Shell)", lockedVolumeMtpa: gapMtpa * 0.36, sharePct: "36%" },
        ];
      }
    }
  }

  refineryImpacts.sort((a, b) => b.lockedVolumeMtpa - a.lockedVolumeMtpa);

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
    estimatedReplenishmentDays: Math.ceil(totalVolumeDeployedMMT / (config.maxDailyDrawdownMtpa * 0.5)),
    prioritizedRefineries: refineryImpacts,
    reasoning,
  };
}
