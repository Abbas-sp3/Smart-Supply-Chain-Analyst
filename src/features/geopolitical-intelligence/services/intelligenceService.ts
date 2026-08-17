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
import type { CountryProfile } from "@/data/countries/types";
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
import {
  normalizeLLMObject,
  validateNormalizedResponse,
} from "@/services/llm";

// ---------------------------------------------------------------------------
// Registered data source plugins
// ---------------------------------------------------------------------------
const DATA_SOURCES: DataSourcePlugin[] = [
  newsDataSource,
  openSkyDataSource,
  aisIntelligenceDataSource,
];

// ---------------------------------------------------------------------------
// Full-report cache keyed by country.id (assembled output)
// ---------------------------------------------------------------------------
type CacheEntry = {
  report: IntelligenceReport;
  generatedAt: number;
};

type GlobalIntelligenceState = typeof globalThis & {
  __intelligenceCache?: Record<string, CacheEntry>;
  __intelligenceInProgress?: Record<string, Promise<IntelligenceReport>>;
};

const globalStore = globalThis as GlobalIntelligenceState;

function getCached(countryId: string): IntelligenceReport | null {
  const entry = globalStore.__intelligenceCache?.[countryId];
  if (!entry) return null;
  if (Date.now() - entry.generatedAt > INTELLIGENCE_CACHE_TTL_MS) return null;
  return entry.report;
}

export function getIntelligenceCacheTimestamp(countryId: string): number {
  return globalStore.__intelligenceCache?.[countryId]?.generatedAt || 0;
}

function setCache(countryId: string, report: IntelligenceReport): void {
  if (!globalStore.__intelligenceCache) globalStore.__intelligenceCache = {};
  globalStore.__intelligenceCache[countryId] = { report, generatedAt: Date.now() };
}

// ---------------------------------------------------------------------------
// Core generation — modular pipeline
// ---------------------------------------------------------------------------
async function generateFresh(country: CountryProfile): Promise<IntelligenceReport> {
  console.log(`[intelligenceService] Generating fresh intelligence report for ${country.name} (modular pipeline)...`);

  // Step 1: Collect from all data source plugins
  const pluginResults = await Promise.allSettled(
    DATA_SOURCES.map((plugin) => plugin.fetch(country)),
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
  const augmentedObservations = await preprocessIntelligence(allSources, country);

  // Step 3: Build enriched intelligence context (with KG tracing + evidence fusion)
  const context = buildIntelligenceContext(augmentedObservations, allSources, country);
  const contextHash = hashIntelligenceContext(context);

  console.log(
    `[intelligenceService] Enriched context: ${context.critical_events.length} events, ` +
      `${context.military_observations.length} military, ${context.maritime_observations.length} maritime, ` +
      `${context.supply_chain_exposure.affected_products.length} exposed products, ` +
      `${context.evidence_signals.length} corroborated signals.`,
  );

  // Step 4: Run all 5 Groq modules in parallel.
  // The llmRouter distributes calls across Groq Key 1 → Key 2 → Gemini fallback,
  // so concurrent requests spread naturally across providers.
  console.log(`[intelligenceService] Running 5 modules in parallel...`);

  const [executive, supplyChain, recommendations, scenarios, evidence] =
    await Promise.all([
      runExecutiveSummaryModule(context, country),
      runSupplyChainImpactModule(context, country),
      runRecommendationsModule(context, country),
      runScenarioAnalysisModule(context, contextHash, country),
      runEvidenceModule(context, country),
    ]);

  // Step 5: Assemble into unified IntelligenceReport (with KG gap-filling)
  const report = assembleIntelligenceReport(
    executive,
    supplyChain,
    recommendations,
    scenarios,
    evidence,
    context.supply_chain_exposure,
  );

  // Step 6: Normalize assembled report, then validate
  const { normalized, repairedFields } = normalizeLLMObject(
    report,
    "intelligence_report",
    "intelligenceService",
  );

  if (repairedFields.length > 0) {
    console.log(
      `[intelligenceService] Repaired ${repairedFields.length} missing field(s) in assembled report.`,
    );
  }

  const validated = validateNormalizedResponse(
    normalized,
    intelligenceReportSchema,
    "intelligenceService",
  );

  console.log("[intelligenceService] Modular report assembled and validated.");

  setCache(country.id, validated);
  return validated;
}

// ---------------------------------------------------------------------------
// Public API — country-parameterized, cache keyed by country.id
// ---------------------------------------------------------------------------

export async function generateIntelligenceReport(country: CountryProfile): Promise<IntelligenceReport> {
  const cached = getCached(country.id);
  if (cached) {
    const ageSeconds = Math.round((Date.now() - (globalStore.__intelligenceCache?.[country.id]?.generatedAt ?? 0)) / 1000);
    console.log(
      `[intelligenceService] Cache HIT for ${country.id} (age: ${ageSeconds}s) — serving from cache, all 5 LLM module calls skipped.`
    );
    return cached;
  }

  if (!globalStore.__intelligenceInProgress) {
    globalStore.__intelligenceInProgress = {};
  }

  const inProgress = globalStore.__intelligenceInProgress[country.id] as IntelligenceReport | Promise<IntelligenceReport> | undefined;
  if (inProgress) {
    console.log(`[intelligenceService] Generation in progress for ${country.id} — awaiting existing promise.`);
    return globalStore.__intelligenceInProgress[country.id]!;
  }

  const promise = generateFresh(country).finally(() => {
    if (globalStore.__intelligenceInProgress) {
      delete globalStore.__intelligenceInProgress[country.id];
    }
  });

  globalStore.__intelligenceInProgress[country.id] = promise;
  return promise;
}
