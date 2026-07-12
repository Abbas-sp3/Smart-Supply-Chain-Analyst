export type RankTier = "recommended" | "viable" | "caution";

export type EnergyCommodityType = "crude_oil" | "natural_gas" | "coal" | "lng" | "gasoline" | "heating_oil" | "uranium" | "brent_crude_oil";

export type EnergySourcingAlternative = {
  option_number: number;
  source: string;
  tier: RankTier;
  commodity: string;
  summary: string;
  detail: string[];
  compatibility: string;
  diplomatic_perspective: string[];
  source_article: { title: string; url: string } | null;
};

export type EnergyBriefing = {
  generated_at: string;
  executive_summary: string;
  historical_comparison: string;
  alternatives: EnergySourcingAlternative[];
  disclaimer: string;
  fallback?: boolean;
};

export type EnergyApiResponse =
  | { briefing: EnergyBriefing; error?: never }
  | { briefing?: never; error: string };

export type ProcurementArticle = {
  title: string;
  description: string;
  publishedAt: string;
  source: string;
  url: string;
};
