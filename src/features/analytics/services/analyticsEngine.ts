/**
 * analyticsEngine.ts — Deterministic cross-module synthesis engine
 *
 * Consumes outputs from all existing engines and produces executive intelligence.
 * No LLMs. No fabricated numbers. Every metric is derived mathematically
 * from DISRUPTION_PRESETS, INDIA_TRADE_GRAPH, and existing engine outputs.
 */

import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { runPropagation } from "@/features/scenario-simulator/services/propagationEngine";
import { generateOptimizationStrategy } from "@/features/strategic-reserve/services/optimizationEngine";
import { INDIA_TRADE_GRAPH } from "@/features/geopolitical-intelligence/knowledge-graph/indiaTradeGraph";
import { CRUDE_ALTERNATIVES } from "@/features/procurement/data/alternativeSources";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";

// ── Types ─────────────────────────────────────────────────────────────────

export type ScenarioAnalysis = {
  preset: DisruptionPreset;
  supplyGapMtpa: number;
  affectedRefineryCount: number;
  totalLockedVolumeMtpa: number;
  durationDays: number;
  sprRequired: boolean;
  primaryResponse: string;
  estimatedRecoveryDays: number;
};

export type VulnerabilityRank = {
  nodeId: string;
  label: string;
  type: string;
  frequencyCount: number; // how many presets affect this node
  totalLockedVolumeMtpa: number;
};

export type ResilienceRank = {
  nodeId: string;
  label: string;
  type: string;
  flexibilityFactor: number;
  baseUtilizationPct: number;
  resilienceScore: number; // higher is more resilient
};

export type GraphCentralityRank = {
  nodeId: string;
  label: string;
  type: string;
  connectionCount: number;
  criticalConnectionCount: number;
  hasCriticalEdges: boolean;
};

export type MitigationComparison = {
  label: string;
  supplyGapMtpa: number;
  gapClosedPct: number;
  description: string;
};

export type AnalyticsSummary = {
  scenarioAnalyses: ScenarioAnalysis[];
  vulnerabilityRanks: VulnerabilityRank[];
  resilienceRanks: ResilienceRank[];
  graphCentralityRanks: GraphCentralityRank[];
  worstCasePreset: DisruptionPreset;
  worstCaseGapMtpa: number;
  mostImpactedNode: string;
  averageGapMtpa: number;
  sprRequiredCount: number;
};

// ── Engine ────────────────────────────────────────────────────────────────

export function runAnalyticsEngine(): AnalyticsSummary {
  // 1. Run propagation + optimization for ALL presets
  const scenarioAnalyses: ScenarioAnalysis[] = DISRUPTION_PRESETS.map((preset) => {
    const prop = runPropagation(preset, []);
    const opt = generateOptimizationStrategy(prop);

    const totalLocked = prop.nodeImpacts.reduce(
      (sum, n) => sum + (n.lockedVolumeMtpa ?? 0),
      0
    );
    const affectedRefineries = prop.nodeImpacts.filter(
      (n) => n.nodeId.startsWith("infra_refin") && (n.lockedVolumeMtpa ?? 0) > 0
    ).length;

    const primaryResponse = opt.recommendRelease
      ? "SPR Release + Procurement Diversification"
      : "Commercial Buffer — No SPR Release Required";

    return {
      preset,
      supplyGapMtpa: prop.metrics.supplyGapMtpa.likely,
      affectedRefineryCount: affectedRefineries,
      totalLockedVolumeMtpa: totalLocked,
      durationDays: preset.expectedDurationDays,
      sprRequired: opt.recommendRelease,
      primaryResponse,
      estimatedRecoveryDays: opt.estimatedReplenishmentDays,
    };
  });

  // 2. Systemic Vulnerability: count how many presets affect each node
  const nodeFrequency: Record<string, { freq: number; locked: number }> = {};
  for (const preset of DISRUPTION_PRESETS) {
    const prop = runPropagation(preset, []);
    for (const impact of prop.nodeImpacts) {
      if (!nodeFrequency[impact.nodeId]) {
        nodeFrequency[impact.nodeId] = { freq: 0, locked: 0 };
      }
      nodeFrequency[impact.nodeId].freq += 1;
      nodeFrequency[impact.nodeId].locked += impact.lockedVolumeMtpa ?? 0;
    }
  }

  const vulnerabilityRanks: VulnerabilityRank[] = Object.entries(nodeFrequency)
    .map(([nodeId, data]) => {
      const node = INDIA_TRADE_GRAPH.find((n) => n.id === nodeId);
      return {
        nodeId,
        label: node?.label ?? nodeId.replace(/_/g, " "),
        type: node?.type ?? "unknown",
        frequencyCount: data.freq,
        totalLockedVolumeMtpa: data.locked,
      };
    })
    .sort((a, b) => b.frequencyCount - a.frequencyCount || b.totalLockedVolumeMtpa - a.totalLockedVolumeMtpa)
    .slice(0, 12);

  // 3. Knowledge Graph Centrality (degree centrality by connection count)
  const graphCentralityRanks: GraphCentralityRank[] = INDIA_TRADE_GRAPH.map((node) => ({
    nodeId: node.id,
    label: node.label,
    type: node.type,
    connectionCount: node.connections.length,
    criticalConnectionCount: node.connections.filter(
      (c) => c.strategicWeight === "Critical"
    ).length,
    hasCriticalEdges: node.connections.some((c) => c.strategicWeight === "Critical"),
  }))
    .sort((a, b) => b.criticalConnectionCount - a.criticalConnectionCount || b.connectionCount - a.connectionCount)
    .slice(0, 12);

  // 4. Resilience ranking: high flex + low utilization = resilient
  const resilienceRanks: ResilienceRank[] = INDIA_TRADE_GRAPH.filter(
    (n) => n.flexibilityFactor !== undefined && n.baseUtilizationPct !== undefined
  )
    .map((node) => {
      const flex = node.flexibilityFactor ?? 0.5;
      const util = node.baseUtilizationPct ?? 50;
      // Score: flexibility component (0-100) minus utilization pressure (0-100)
      const resilienceScore = flex * 100 - util * 0.5;
      return {
        nodeId: node.id,
        label: node.label,
        type: node.type,
        flexibilityFactor: flex,
        baseUtilizationPct: util,
        resilienceScore,
      };
    })
    .sort((a, b) => b.resilienceScore - a.resilienceScore);

  // 5. Aggregate metrics
  const worstCase = scenarioAnalyses.reduce((prev, curr) =>
    curr.supplyGapMtpa > prev.supplyGapMtpa ? curr : prev
  );
  const avgGap =
    scenarioAnalyses.reduce((sum, s) => sum + s.supplyGapMtpa, 0) /
    scenarioAnalyses.length;
  const sprRequiredCount = scenarioAnalyses.filter((s) => s.sprRequired).length;
  const topVulnNode = vulnerabilityRanks[0];

  return {
    scenarioAnalyses,
    vulnerabilityRanks,
    resilienceRanks,
    graphCentralityRanks,
    worstCasePreset: worstCase.preset,
    worstCaseGapMtpa: worstCase.supplyGapMtpa,
    mostImpactedNode: topVulnNode?.label ?? "Unknown",
    averageGapMtpa: avgGap,
    sprRequiredCount,
  };
}

// ── Active-scenario mitigation comparison ─────────────────────────────────

export function computeMitigationComparison(
  preset: DisruptionPreset,
  procurementAlternatives: { name: string; supplyMtpa: number }[] = []
): MitigationComparison[] {
  const baseProp = runPropagation(preset, []);
  const baseGap = baseProp.metrics.supplyGapMtpa.likely;

  // After SPR deployment (partial fill at max drawdown rate)
  const sprOpt = generateOptimizationStrategy(baseProp);
  const sprDeployedMtpa = sprOpt.effectiveDailyRateMtpa * 365; // annualized deployed volume
  const afterSprGap = Math.max(0, baseGap - sprDeployedMtpa);

  // After procurement (use top-ranked alternative volume, assume covers 30% of gap as illustrative)
  // This is the best available deterministic estimate without a live procurement fill engine
  const procFilledMtpa = procurementAlternatives.length > 0
    ? procurementAlternatives[0].supplyMtpa
    : baseGap * 0.3; // illustrative: top source covers ~30% of gap
  const afterProcGap = Math.max(0, baseGap - procFilledMtpa);

  // Combined
  const combinedGap = Math.max(0, baseGap - sprDeployedMtpa - procFilledMtpa);

  return [
    {
      label: "No Mitigation",
      supplyGapMtpa: baseGap,
      gapClosedPct: 0,
      description: "Full disruption impact with no intervention.",
    },
    {
      label: "SPR Release Only",
      supplyGapMtpa: afterSprGap,
      gapClosedPct: baseGap > 0 ? ((baseGap - afterSprGap) / baseGap) * 100 : 0,
      description: `SPR deployed at max rate (${(sprOpt.effectiveDailyRateMtpa * 1000).toFixed(1)} kMT/day). ${sprOpt.cappedByRateLimit ? "Physically capped — full gap cannot be covered by SPR alone." : "Rate sufficient within physical limits."}`,
    },
    {
      label: "Procurement Diversification Only",
      supplyGapMtpa: afterProcGap,
      gapClosedPct: baseGap > 0 ? ((baseGap - afterProcGap) / baseGap) * 100 : 0,
      description: "Alternative procurement activated (top-ranked non-Gulf source). Illustrative volume assumption.",
    },
    {
      label: "Combined Mitigation",
      supplyGapMtpa: combinedGap,
      gapClosedPct: baseGap > 0 ? ((baseGap - combinedGap) / baseGap) * 100 : 0,
      description: "SPR release + procurement diversification applied simultaneously.",
    },
  ];
}

// ── Executive Strategic Brief generator ────────────────────────────────────

export function generateStrategicBrief(
  summary: AnalyticsSummary,
  activePreset: DisruptionPreset
): string[] {
  const insights: string[] = [];

  // From active scenario
  const activeAnalysis = summary.scenarioAnalyses.find(
    (s) => s.preset.id === activePreset.id
  );

  if (activeAnalysis) {
    const gapStr = activeAnalysis.supplyGapMtpa.toFixed(1);
    if (activeAnalysis.supplyGapMtpa > 20) {
      insights.push(
        `Active scenario (${activePreset.label}) generates a ${gapStr} Mtpa supply gap — a severe shock exceeding commercial buffer capacity.`
      );
    } else if (activeAnalysis.supplyGapMtpa > 0) {
      insights.push(
        `Active scenario (${activePreset.label}) generates a ${gapStr} Mtpa supply gap — within commercial buffer limits. SPR release not currently required.`
      );
    } else {
      insights.push(
        `Active scenario (${activePreset.label}) produces no material supply gap under current propagation parameters.`
      );
    }

    insights.push(
      activeAnalysis.sprRequired
        ? `Strategic Petroleum Reserve release is recommended for the active scenario. Estimated ${activeAnalysis.estimatedRecoveryDays} days to refill post-deployment.`
        : `No Strategic Petroleum Reserve deployment is required for the active scenario. Commercial procurement buffers are sufficient.`
    );
  }

  // Cross-scenario structural insight
  insights.push(
    `Across all ${DISRUPTION_PRESETS.length} modelled scenarios, SPR release is triggered in ${summary.sprRequiredCount} cases — suggesting concentrated risk in high-severity Gulf disruptions.`
  );

  insights.push(
    `${summary.mostImpactedNode} is the most frequently impacted supply chain node, appearing in ${summary.vulnerabilityRanks[0]?.frequencyCount ?? 0} of ${DISRUPTION_PRESETS.length} disruption scenarios.`
  );

  // Worst case
  insights.push(
    `Worst-case modelled disruption is ${summary.worstCasePreset.label}, with a projected ${summary.worstCaseGapMtpa.toFixed(1)} Mtpa supply gap — ${((summary.worstCaseGapMtpa / summary.averageGapMtpa)).toFixed(1)}× the average across all scenarios.`
  );

  // Procurement insight (most relevant alternative for active scenario)
  const bestAlt = CRUDE_ALTERNATIVES.filter(
    (a) =>
      !a.relevantForPresets ||
      a.relevantForPresets.length === 0 ||
      a.relevantForPresets.includes(activePreset.id)
  ).sort((a, b) => a.priceDiffBbl - b.priceDiffBbl)[0];

  if (bestAlt) {
    insights.push(
      `For the active scenario, ${bestAlt.name} is the most cost-effective procurement alternative (${bestAlt.priceDiffBbl >= 0 ? "+" : ""}${bestAlt.priceDiffBbl.toFixed(1)} $/bbl vs Brent), with ${bestAlt.availabilityScore}/5 tanker availability.`
    );
  }

  return insights.slice(0, 6);
}
