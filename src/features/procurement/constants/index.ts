/** Groq model for procurement — uses a separate rate-limit pool from the 70b intelligence modules */
export const PROCUREMENT_GROQ_MODEL = "llama-3.1-8b-instant";

export const PROCUREMENT_GROQ_MAX_TOKENS = 2500;

export const PROCUREMENT_CACHE_TTL_MS = 30 * 60 * 1000;

export const PROCUREMENT_NEWS_QUERY =
  "Strait of Hormuz OR crude oil sanctions OR Gulf tensions OR India crude imports";

export const PROCUREMENT_NEWS_PAGE_SIZE = 8;
