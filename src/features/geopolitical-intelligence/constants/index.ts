/**
 * Geopolitical Intelligence Engine — Constants
 */

/** NewsAPI search keywords targeting India trade corridors */
export const NEWS_KEYWORDS = [
  "India imports",
  "India trade",
  "India supply chain",
  "Red Sea shipping",
  "Strait of Hormuz",
  "Persian Gulf oil",
  "China India trade",
  "semiconductor shortage",
  "oil price",
  "LNG supply",
  "geopolitical risk",
  "port disruption",
  "shipping lane",
  "sanctions trade",
  "OPEC oil",
  "rare earth minerals",
  "pharmaceutical supply chain",
  "fertilizer shortage",
  "India crude oil",
  "Bay of Bengal",
];

/** How long the assembled report stays cached before a fresh generation is triggered */
export const INTELLIGENCE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Per-module cache TTLs — modules refresh independently */
export const MODULE_TTL_EXECUTIVE_MS = 15 * 60 * 1000; // 15 minutes
export const MODULE_TTL_SUPPLY_CHAIN_MS = 30 * 60 * 1000; // 30 minutes
export const MODULE_TTL_RECOMMENDATIONS_MS = 30 * 60 * 1000; // 30 minutes
export const MODULE_TTL_EVIDENCE_MS = 30 * 60 * 1000; // 30 minutes
// Scenario module invalidates on intelligence context hash change, not time

/** Maximum articles to pass to the AI per generation cycle */
export const MAX_ARTICLES_PER_FETCH = 25;

/** Groq model to use for intelligence generation */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/** Max tokens for the legacy single-call path (kept for fact extraction) */
export const GROQ_MAX_TOKENS = 4096;

/** Max tokens per intelligence module */
export const GROQ_MODULE_MAX_TOKENS = 3072;

/** Per-module token overrides — enriched context requires higher limits */
export const MODULE_MAX_TOKENS: Record<string, number> = {
  executive_summary: 3072,
  supply_chain_impact: 3584,
  recommendations: 4096,
  scenario_analysis: 3584,
  evidence: 3072,
};
