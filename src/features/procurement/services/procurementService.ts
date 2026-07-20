/**
 * procurementService.ts — Procurement intelligence orchestration
 *
 * Uses a compact prompt + fast Groq model (separate rate-limit pool from 70b).
 * Falls back to curated mock briefing when Groq or NewsAPI is unavailable.
 */

import { callGroq } from "@/features/geopolitical-intelligence/services/groqService";
import {
  parseAndNormalizeLLMResponse,
  validateNormalizedResponse,
} from "@/services/llm";
import type { ProcurementArticle, EnergyBriefing } from "../types";
import { energyBriefingSchema } from "../schemas/procurement.schema";
import {
  PROCUREMENT_GROQ_MODEL,
  PROCUREMENT_GROQ_MAX_TOKENS,
  PROCUREMENT_CACHE_TTL_MS,
  PROCUREMENT_NEWS_QUERY,
  PROCUREMENT_NEWS_PAGE_SIZE,
} from "../constants";
import {
  PROCUREMENT_SYSTEM_PROMPT,
  buildProcurementUserPrompt,
} from "../prompts/system.prompt";
import {
  MOCK_PROCUREMENT_ARTICLES,
  MOCK_PROCUREMENT_BRIEFING,
} from "../data/mock-briefing";

type CacheEntry = { briefing: EnergyBriefing; generatedAt: number };

type GlobalProcurementState = typeof globalThis & {
  __procurementCache?: CacheEntry;
  __procurementInProgress?: Promise<EnergyBriefing>;
};

const globalStore = globalThis as GlobalProcurementState;

async function fetchArticles(): Promise<ProcurementArticle[]> {
  // Support dual API keys to spread across quota limits — use NEWS_API_KEY_2 as overflow
  const keys = [
    process.env.NEWS_API_KEY,
    process.env.NEWS_API_KEY_2,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    console.log("[procurementService] No NEWS_API_KEY set — using mock articles.");
    return MOCK_PROCUREMENT_ARTICLES;
  }

  // Round-robin: alternate keys by minute so both quota pools are used evenly
  const apiKey = keys[Math.floor(Date.now() / 60_000) % keys.length];

  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", PROCUREMENT_NEWS_QUERY);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", String(PROCUREMENT_NEWS_PAGE_SIZE));
    url.searchParams.set("apiKey", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });

    // Diagnostic: always log the HTTP status so we can see 426/429/200 in terminal
    console.log(`[procurementService] NewsAPI HTTP ${res.status} (key: ...${apiKey.slice(-6)})`);

    if (!res.ok) {
      console.warn(`[procurementService] NewsAPI non-OK (${res.status}) — falling back to mock articles.`);
      return MOCK_PROCUREMENT_ARTICLES;
    }

    const data = (await res.json()) as {
      status?: string;
      code?: string;
      message?: string;
      totalResults?: number;
      articles?: Array<{
        title?: string;
        description?: string;
        publishedAt?: string;
        source?: { name?: string };
        url?: string;
      }>;
    };

    // NewsAPI sometimes returns HTTP 200 with status:"error" body (e.g. apiKeyInvalid)
    if (data.status === "error") {
      console.warn(`[procurementService] NewsAPI error body: ${data.code} — ${data.message}. Falling back to mock.`);
      return MOCK_PROCUREMENT_ARTICLES;
    }

    const articles = (data.articles ?? [])
      .filter((a) => a.title && a.description)
      .map((a) => ({
        title: a.title ?? "",
        description: a.description ?? "",
        publishedAt: a.publishedAt ?? new Date().toISOString(),
        source: a.source?.name ?? "Unknown",
        url: a.url ?? "",
      }));

    console.log(`[procurementService] NewsAPI returned ${articles.length} usable articles (of ${data.totalResults ?? "?"} total).`);

    // Empty successful response → still fall back to mock so LLM has real content
    if (articles.length === 0) {
      console.warn("[procurementService] Zero articles after filtering — falling back to mock articles.");
      return MOCK_PROCUREMENT_ARTICLES;
    }

    return articles;
  } catch (err) {
    console.error("[procurementService] News fetch threw:", err);
    return MOCK_PROCUREMENT_ARTICLES;
  }
}

async function generateFromLLM(
  articles: ProcurementArticle[],
): Promise<EnergyBriefing> {
  const raw = await callGroq(
    PROCUREMENT_SYSTEM_PROMPT,
    buildProcurementUserPrompt(articles),
    PROCUREMENT_GROQ_MODEL,
    PROCUREMENT_GROQ_MAX_TOKENS,
  );

  const { normalized, repairedFields } = parseAndNormalizeLLMResponse(
    raw,
    "procurement_briefing",
    "procurementService",
  );

  if (repairedFields.length > 0) {
    console.log(
      `[procurementService] Repaired ${repairedFields.length} missing field(s).`,
    );
  }

  const validated = validateNormalizedResponse(
    normalized,
    energyBriefingSchema,
    "procurementService",
  );

  // Safety check: if the LLM produced a generic "no articles" sentinel or an empty
  // executive_summary, the model failed to synthesize anything meaningful.
  // Throw so the caller falls through to the mock briefing.
  const summary: string = (validated as { executive_summary?: string }).executive_summary ?? "";
  const EMPTY_SENTINELS = [
    "no relevant energy news articles",
    "no relevant articles",
    "no news articles",
    "no articles were found",
    "no relevant news",
  ];
  if (
    !summary ||
    summary.length < 40 ||
    EMPTY_SENTINELS.some((s) => summary.toLowerCase().includes(s))
  ) {
    console.warn("[procurementService] LLM returned empty/generic summary — triggering mock fallback.");
    throw new Error("LLM produced empty executive_summary — fallback triggered");
  }

  return {
    ...validated,
    generated_at: new Date().toISOString(),
  };
}

function buildFallbackBriefing(): EnergyBriefing {
  return {
    ...MOCK_PROCUREMENT_BRIEFING,
    generated_at: new Date().toISOString(),
    fallback: true,
  };
}

async function generateFresh(): Promise<EnergyBriefing> {
  const articles = await fetchArticles();

  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.log("[procurementService] No LLM API key — serving mock briefing.");
    return buildFallbackBriefing();
  }

  try {
    return await generateFromLLM(articles);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[procurementService] LLM generation failed:", message);

    if (
      message.includes("429") ||
      message.includes("rate_limit") ||
      message.includes("Rate limit")
    ) {
      console.log("[procurementService] Rate limited — serving mock briefing.");
    }

    return buildFallbackBriefing();
  }
}

function getCached(): EnergyBriefing | null {
  const entry = globalStore.__procurementCache;
  if (!entry) return null;
  if (Date.now() - entry.generatedAt > PROCUREMENT_CACHE_TTL_MS) return null;
  return entry.briefing;
}

function setCache(briefing: EnergyBriefing): void {
  globalStore.__procurementCache = {
    briefing,
    generatedAt: Date.now(),
  };
}

export async function generateProcurementBriefing(): Promise<EnergyBriefing> {
  const cached = getCached();
  if (cached) {
    console.log("[procurementService] Returning cached briefing.");
    return cached;
  }

  if (globalStore.__procurementInProgress) {
    return globalStore.__procurementInProgress;
  }

  const promise = generateFresh()
    .then((briefing) => {
      setCache(briefing);
      return briefing;
    })
    .finally(() => {
      globalStore.__procurementInProgress = undefined;
    });

  globalStore.__procurementInProgress = promise;
  return promise;
}

export type { EnergyBriefing };
