export type ReplaySnapshot = {
  date: string;
  news_context_note: string;
  system_recommendation: {
    executive_summary: string;
    top_option: string;
    tier: "recommended" | "viable" | "caution";
  };
  actual_outcome: {
    real_price_brent: number | null;
    real_price_wti: number | null;
    documented_response: string;
    source_url: string | null;
  };
  lead_time_days: number | null;
};

export const REPLAY_DATES = [
  "2026-02-28",
  "2026-03-10",
  "2026-03-25",
  "2026-04-15",
  "2026-05-01",
  "2026-06-10",
] as const;

export type ReplayDate = (typeof REPLAY_DATES)[number];
