"use client";

import { Brain } from "lucide-react";
import { useCountry } from "@/hooks/useCountry";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import {
  runAnalyticsEngine,
  generateStrategicBrief,
  computeMitigationComparison,
} from "@/features/analytics/services/analyticsEngine";

import { DataFreshnessPanel } from "@/features/analytics/components/sections/DataFreshnessPanel";
import { ExecutiveStrategicBrief } from "@/features/analytics/components/sections/ExecutiveStrategicBrief";
import { SystemicVulnerabilityAnalysis } from "@/features/analytics/components/sections/SystemicVulnerabilityAnalysis";
import { MitigationEffectiveness } from "@/features/analytics/components/sections/MitigationEffectiveness";
import { ScenarioComparisonExpanded } from "@/features/analytics/components/sections/ScenarioComparisonExpanded";
import { KnowledgeGraphAnalytics } from "@/features/analytics/components/sections/KnowledgeGraphAnalytics";
import { MarketAnalytics } from "@/features/analytics/components/sections/MarketAnalytics";
import { HistoricalPatternAnalysis } from "@/features/analytics/components/sections/HistoricalPatternAnalysis";
import { ExecutiveDecisionSupport } from "@/features/analytics/components/sections/ExecutiveDecisionSupport";
import { ResponsePipeline } from "@/features/analytics/components/sections/ResponsePipeline";

import { EnergyFlowSection } from "@/features/analytics/components/sections/EnergyFlowSection";
import { EnergyHorusWidgets } from "@/features/analytics/components/sections/EnergyHorusWidgets";

// Metadata cannot be exported from a client component, moved or removed

// Default to the highest-severity preset (Hormuz Full Closure) as the active scenario
const DEFAULT_PRESET_ID = "hormuz_full_closure";

export default function AnalyticsPage() {
  const { activeCountry } = useCountry();
  const presets = activeCountry.disruptionPresets;

  const activePreset =
    presets.find((p) => p.id === DEFAULT_PRESET_ID) ?? presets[0];

  let summary: ReturnType<typeof runAnalyticsEngine>;
  let insights: string[];
  let mitigationComparison: ReturnType<typeof computeMitigationComparison>;

  try {
    summary = runAnalyticsEngine(activeCountry);
    insights = generateStrategicBrief(summary, activePreset);
    mitigationComparison = computeMitigationComparison(activePreset, [], activeCountry);
  } catch (err) {
    console.error("[Analytics] Engine error:", err);
    // Safe fallback — re-throw so Next.js error boundary catches it
    throw err;
  }

  const activeAnalysis = summary.scenarioAnalyses.find(
    (s) => s.preset.id === activePreset.id
  )!;

  return (
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-6">
        <section aria-labelledby="freshness-heading">
          <h2 id="freshness-heading" className="sr-only">Data Freshness</h2>
          <DataFreshnessPanel />
        </section>
        <section aria-labelledby="exec-brief-heading">
          <h2 id="exec-brief-heading" className="sr-only">Executive Strategic Brief</h2>
          <ExecutiveStrategicBrief
            insights={insights}
            activePreset={activePreset}
            summary={summary}
          />
        </section>
        <section aria-labelledby="energy-flow-heading">
          <h2 id="energy-flow-heading" className="sr-only">Strategic Energy Flow</h2>
          <EnergyFlowSection />
        </section>
        <section aria-labelledby="vulnerability-heading">
          <h2 id="vulnerability-heading" className="sr-only">Systemic Vulnerability Analysis</h2>
          <SystemicVulnerabilityAnalysis vulnerabilityRanks={summary.vulnerabilityRanks} />
        </section>
        <section aria-labelledby="mitigation-heading">
          <h2 id="mitigation-heading" className="sr-only">Mitigation Effectiveness</h2>
          <MitigationEffectiveness
            mitigationComparison={mitigationComparison}
            activePreset={activePreset}
          />
        </section>
        <section aria-labelledby="scenario-comparison-heading">
          <h2 id="scenario-comparison-heading" className="sr-only">Scenario Comparison</h2>
          <ScenarioComparisonExpanded scenarioAnalyses={summary.scenarioAnalyses} />
        </section>
        <section aria-labelledby="graph-analytics-heading">
          <h2 id="graph-analytics-heading" className="sr-only">Knowledge Graph Analytics</h2>
          <KnowledgeGraphAnalytics
            graphCentralityRanks={summary.graphCentralityRanks}
            resilienceRanks={summary.resilienceRanks}
          />
        </section>
        <section aria-labelledby="energy-horus-heading">
          <h2 id="energy-horus-heading" className="sr-only">Energy Market & Risk Intelligence</h2>
          <EnergyHorusWidgets />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section aria-labelledby="market-analytics-heading">
            <h2 id="market-analytics-heading" className="sr-only">Market Analytics</h2>
            <MarketAnalytics />
          </section>

          <section aria-labelledby="historical-heading">
            <h2 id="historical-heading" className="sr-only">Historical Pattern Analysis</h2>
            <HistoricalPatternAnalysis activePreset={activePreset} />
          </section>
        </div>
        <section aria-labelledby="decision-support-heading">
          <h2 id="decision-support-heading" className="sr-only">Executive Decision Support</h2>
          <ExecutiveDecisionSupport
            activeAnalysis={activeAnalysis}
            activePreset={activePreset}
          />
        </section>
        <section aria-labelledby="pipeline-heading">
          <h2 id="pipeline-heading" className="sr-only">Response Pipeline</h2>
          <ResponsePipeline />
        </section>

      </div>
  );
}
