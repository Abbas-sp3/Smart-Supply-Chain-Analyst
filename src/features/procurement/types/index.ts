/**
 * Procurement feature — Type definitions
 */

export type RankTier = "recommended" | "viable" | "caution";

export type ProcurementAlternative = {
  option_number: number;
  source: string;
  tier: RankTier;
  summary: string;
  detail: string[];
  refinery_compatibility: string;
  diplomatic_perspective: string[];
  source_article: { title: string; url: string } | null;
};

export type CriticalCargo = {
  item: string;
  detail: string;
  mode: string;
  eta: string;
} | null;

export type ProcurementBriefing = {
  generated_at: string;
  executive_summary: string;
  historical_comparison: string;
  alternatives: ProcurementAlternative[];
  critical_cargo: CriticalCargo;
  disclaimer: string;
  /** Present when Groq was unavailable and mock data was served */
  fallback?: boolean;
};

export type ProcurementApiResponse =
  | { briefing: ProcurementBriefing; error?: never }
  | { briefing?: never; error: string };

export type ProcurementArticle = {
  title: string;
  description: string;
  publishedAt: string;
  source: string;
  url: string;
};
