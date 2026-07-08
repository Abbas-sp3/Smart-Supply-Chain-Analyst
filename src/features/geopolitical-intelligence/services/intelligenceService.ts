/**
 * intelligenceService.ts — Intelligence Orchestration Layer
 *
 * Responsibilities:
 * 1. Collect data from all registered DataSourcePlugins
 * 2. Build the AI prompt from collected data
 * 3. Call Groq via groqService
 * 4. Parse and validate the JSON response with Zod
 * 5. Cache the result for INTELLIGENCE_CACHE_TTL_MS
 * 6. Return a typed IntelligenceReport
 *
 * Future data sources (AIS, commodity prices, weather, port congestion,
 * satellite imagery, sanctions databases) are plugged in by registering
 * a new DataSourcePlugin — this file and the frontend never change.
 */

import type { DataSourcePlugin, IntelligenceReport } from "../types";
import { intelligenceReportSchema } from "../schemas/intelligence.schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompts/system.prompt";
import { callGroq } from "./groqService";
import { newsDataSource } from "./newsService";
import { INTELLIGENCE_CACHE_TTL_MS } from "../constants";

// ---------------------------------------------------------------------------
// Registered data source plugins
// Add new sources here — the rest of the system is unaffected.
// ---------------------------------------------------------------------------
const DATA_SOURCES: DataSourcePlugin[] = [
  newsDataSource,
  // Future: aisDataSource
  // Future: commodityPriceDataSource
  // Future: portCongestionDataSource
  // Future: sanctionsDataSource
  // Future: weatherDataSource
];

// ---------------------------------------------------------------------------
// In-memory cache (same pattern as AIS manager)
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
// JSON extraction — handles cases where the model wraps JSON in markdown
// ---------------------------------------------------------------------------
function extractJson(raw: string): string {
  // Strip markdown code fences if the model wrapped it anyway
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find the first { and last } to extract the JSON object
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw.trim();
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------
async function generateFresh(): Promise<IntelligenceReport> {
  console.log("[intelligenceService] Generating fresh intelligence report...");

  // Step 1: Collect from all data source plugins in parallel
  const pluginResults = await Promise.allSettled(
    DATA_SOURCES.map((plugin) => plugin.fetch()),
  );

  const allSources = pluginResults.flatMap((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
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

  // Step 2: Build the AI prompt
  const userPrompt = buildUserPrompt(allSources);

  // Step 3: Call Groq
  const rawResponse = await callGroq(SYSTEM_PROMPT, userPrompt);

  // Step 4: Extract and parse JSON
  const jsonString = extractJson(rawResponse);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("[intelligenceService] Failed to parse JSON from Groq response:", jsonString.slice(0, 500));
    throw new Error(`[intelligenceService] Groq returned invalid JSON: ${String(err)}`);
  }

  // Step 5: Validate with Zod
  const validated = intelligenceReportSchema.parse(parsed);

  console.log("[intelligenceService] Report validated successfully.");

  // Step 6: Cache and return
  setCache(validated);
  return validated;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns an IntelligenceReport.
 * Uses the cached version if still fresh; generates a new one otherwise.
 * Deduplicates concurrent in-flight requests so Groq is only called once.
 */
export async function generateIntelligenceReport(): Promise<IntelligenceReport> {
  // Return cached report if still valid
  const cached = getCached();
  if (cached) {
    console.log("[intelligenceService] Returning cached report.");
    return cached;
  }

  // Deduplicate concurrent requests — if generation is already in progress,
  // wait for it rather than spawning a second Groq call
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
