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

/** How long an intelligence report stays cached before a fresh generation is triggered */
export const INTELLIGENCE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Maximum articles to pass to the AI per generation cycle */
export const MAX_ARTICLES_PER_FETCH = 25;

/** Groq model to use for intelligence generation */
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/** Max tokens for the AI response (increased for expanded fusion engine schema) */
export const GROQ_MAX_TOKENS = 4096;
