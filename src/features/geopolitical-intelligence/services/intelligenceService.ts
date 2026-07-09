/**
 * intelligenceService.ts — Intelligence Orchestration Layer
 *
 * Pipeline:
 *   Collectors → Normalizers → Fact Extraction → Knowledge Graph → Priority Engine
 *   → Compact Intelligence Context → 5 Independent Groq Modules → Report Assembly
 *
 * Each module runs independently with its own cache TTL.
 * React renders the assembled IntelligenceReport — Groq never generates UI prose.
 */

import type { DataSourcePlugin, IntelligenceReport } from "../types";
import { intelligenceReportSchema } from "../schemas/intelligence.schema";
import { newsDataSource } from "./newsService";
import { openSkyDataSource } from "./openSkyService";
import { aisIntelligenceDataSource } from "./aisIntelligenceService";
import { preprocessIntelligence } from "./preprocessingService";
import {
  buildIntelligenceContext,
  hashIntelligenceContext,
} from "./intelligenceContextService";
import { assembleIntelligenceReport } from "./reportAssembler";
import { runExecutiveSummaryModule } from "../modules/executiveSummaryModule";
import { runSupplyChainImpactModule } from "../modules/supplyChainImpactModule";
import { runRecommendationsModule } from "../modules/recommendationsModule";
import { runScenarioAnalysisModule } from "../modules/scenarioAnalysisModule";
import { runEvidenceModule } from "../modules/evidenceModule";
import { INTELLIGENCE_CACHE_TTL_MS } from "../constants";

// ---------------------------------------------------------------------------
// Registered data source plugins
// ---------------------------------------------------------------------------
const DATA_SOURCES: DataSourcePlugin[] = [
  newsDataSource,
  openSkyDataSource,
  aisIntelligenceDataSource,
];

// ---------------------------------------------------------------------------
// Full-report cache (assembled output)
// ---------------------------------------------------------------------------
type CacheEntry = {
  report: IntelligenceReport;
  generatedAt: number;
};

type GlobalIntelligenceState = typeof globalThis & {
  __intelligenceCache?: CacheEntry;
  __intelligenceInProgress?: Promise<IntelligenceReport>;
};

const globalStore = globalThis as GlobalIntelligenceState;

function getCached(): IntelligenceReport | null {
  const entry = globalStore.__intelligenceCache;
  if (!entry) return null;
  if (Date.now() - entry.generatedAt > INTELLIGENCE_CACHE_TTL_MS) return null;
  return entry.report;
}

function setCache(report: IntelligenceReport): void {
  globalStore.__intelligenceCache = { report, generatedAt: Date.now() };
}

// ---------------------------------------------------------------------------
// Core generation — modular pipeline
// ---------------------------------------------------------------------------
async function generateFresh(): Promise<IntelligenceReport> {
  console.log("[intelligenceService] Generating fresh intelligence report (modular pipeline)...");

  // Step 1: Collect from all data source plugins
  const pluginResults = await Promise.allSettled(
    DATA_SOURCES.map((plugin) => plugin.fetch()),
  );

  const allSources = pluginResults.flatMap((result, i) => {
    if (result.status === "fulfilled") return result.value;
    console.error(
      `[intelligenceService] Plugin "${DATA_SOURCES[i]?.name}" failed:`,
      result.reason,
    );
    return [];
  });

  if (allSources.length === 0) {
    throw new Error(
      "[intelligenceService] All data sources failed to return content.",
    );
  }

  console.log(
    `[intelligenceService] Collected ${allSources.length} data items from ${DATA_SOURCES.length} plugin(s).`,
  );

  // Step 2: Preprocess — fact extraction, knowledge graph, prioritization
  const augmentedObservations = await preprocessIntelligence(allSources);

  // Step 3: Build compact intelligence context (no raw payloads)
  const context = buildIntelligenceContext(augmentedObservations);
  const contextHash = hashIntelligenceContext(context);

  console.log(
    `[intelligenceService] Compact context: ${context.critical_events.length} events, ` +
      `${context.military_observations.length} military, ${context.maritime_observations.length} maritime.`,
  );

  // Step 4: Run independent Groq modules in parallel
  const [executive, supplyChain, recommendations, scenarios, evidence] =
    await Promise.all([
      runExecutiveSummaryModule(context),
      runSupplyChainImpactModule(context),
      runRecommendationsModule(context),
      runScenarioAnalysisModule(context, contextHash),
      runEvidenceModule(context),
    ]);

  // Step 5: Assemble into unified IntelligenceReport
  const report = assembleIntelligenceReport(
    executive,
    supplyChain,
    recommendations,
    scenarios,
    evidence,
  );

  // Step 6: Validate assembled report
  const validated = intelligenceReportSchema.parse(report);

  console.log("[intelligenceService] Modular report assembled and validated.");

  setCache(validated);
  return validated;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateIntelligenceReport(): Promise<IntelligenceReport> {
  const cached = getCached();
  if (cached) {
    console.log("[intelligenceService] Returning cached report.");
    return cached;
  }

  if (globalStore.__intelligenceInProgress) {
    console.log("[intelligenceService] Generation in progress — awaiting existing promise.");
    return globalStore.__intelligenceInProgress;
  }

  const promise = generateFresh().finally(() => {
    globalStore.__intelligenceInProgress = undefined;
  });

  globalStore.__intelligenceInProgress = promise;
  return promise;
}
