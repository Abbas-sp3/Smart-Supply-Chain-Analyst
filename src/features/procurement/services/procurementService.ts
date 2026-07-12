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
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.log("[procurementService] No NEWS_API_KEY — using mock articles.");
    return MOCK_PROCUREMENT_ARTICLES;
  }

  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", PROCUREMENT_NEWS_QUERY);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", String(PROCUREMENT_NEWS_PAGE_SIZE));
    url.searchParams.set("apiKey", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error(`[procurementService] NewsAPI error: ${res.status}`);
      return MOCK_PROCUREMENT_ARTICLES;
    }

    const data = (await res.json()) as {
      articles?: Array<{
        title?: string;
        description?: string;
        publishedAt?: string;
        source?: { name?: string };
        url?: string;
      }>;
    };

    const articles = (data.articles ?? [])
      .filter((a) => a.title && a.description)
      .map((a) => ({
        title: a.title ?? "",
        description: a.description ?? "",
        publishedAt: a.publishedAt ?? new Date().toISOString(),
        source: a.source?.name ?? "Unknown",
        url: a.url ?? "",
      }));

    return articles.length > 0 ? articles : MOCK_PROCUREMENT_ARTICLES;
  } catch (err) {
    console.error("[procurementService] News fetch failed:", err);
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
