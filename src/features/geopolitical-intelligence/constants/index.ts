/**
 * Geopolitical Intelligence Engine — Constants
 */

export const NEWS_KEYWORDS = [
  "India energy imports",
  "India energy trade",
  "energy supply chain",
  "Red Sea shipping",
  "Strait of Hormuz",
  "Persian Gulf oil",
  "oil price",
  "LNG supply",
  "energy geopolitics",
  "port disruption",
  "energy sanctions",
  "OPEC oil",
  "India crude oil",
  "natural gas prices",
  "coal import",
  "energy security",
  "import dependency energy",
  "energy corridor",
  "energy transition",
  "renewable energy supply chain",
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
