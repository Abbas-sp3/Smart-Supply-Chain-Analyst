import { Brain } from "lucide-react";
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

export const metadata = {
  title: "Analytics — Strategic Intelligence Layer | Supply Chain Resilience Platform",
  description:
    "Executive-level synthesis of all operational modules. Cross-scenario analysis, vulnerability rankings, and decision support for India's energy supply chain.",
};

// Default to the highest-severity preset (Hormuz Full Closure) as the active scenario
const DEFAULT_PRESET_ID = "hormuz_full_closure";

export default function AnalyticsPage() {
  const activePreset =
    DISRUPTION_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) ?? DISRUPTION_PRESETS[0];

  let summary: ReturnType<typeof runAnalyticsEngine>;
  let insights: string[];
  let mitigationComparison: ReturnType<typeof computeMitigationComparison>;

  try {
    summary = runAnalyticsEngine();
    insights = generateStrategicBrief(summary, activePreset);
    mitigationComparison = computeMitigationComparison(activePreset);
  } catch (err) {
    console.error("[Analytics] Engine error:", err);
    // Safe fallback — re-throw so Next.js error boundary catches it
    throw err;
  }

  const activeAnalysis = summary.scenarioAnalyses.find(
    (s) => s.preset.id === activePreset.id
  )!;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
              <Brain className="size-5 text-sky-400" aria-hidden />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">
                Strategic Intelligence Layer
              </h1>
              <p className="text-xs text-muted-foreground">
                Executive synthesis of all operational modules — answers what no single module can
              </p>
            </div>
            <div className="ml-auto hidden items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 px-3 py-1 text-[10px] font-semibold text-sky-400 md:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-sky-400" />
              ACTIVE: {activePreset.label}
            </div>
          </div>
        </div>
      </div>
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
    </div>
  );
}
