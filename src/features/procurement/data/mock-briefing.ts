import type { ProcurementArticle } from "../types";

export const MOCK_PROCUREMENT_ARTICLES: ProcurementArticle[] = [
  {
    title: "Strait of Hormuz Tensions Rise Amid Iran-US Standoff",
    description:
      "Naval standoffs in the Persian Gulf have increased insurance premiums for crude tankers. India imports a significant share of Gulf crude via routes near Hormuz.",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: "Al Jazeera",
    url: "https://example.com/hormuz-tensions",
  },
  {
    title: "OPEC+ Extends Production Cuts, Brent Crude Rises",
    description:
      "OPEC+ extended output cuts. India, importing over 80% of crude, faces higher feedstock costs for refineries including Reliance, HPCL, and BPCL.",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: "Financial Times",
    url: "https://example.com/opec-cuts",
  },
  {
    title: "India Diversifies Energy Sources Amid Global Supply Chain Pressures",
    description:
      "Indian importers are diversifying crude, LNG, and coal sources as geopolitical disruptions and price volatility impact energy security for import-dependent economies.",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: "Reuters",
    url: "https://example.com/india-energy-diversification",
  },
];

export const MOCK_PROCUREMENT_BRIEFING = {
  executive_summary:
    "Gulf shipping risk and OPEC+ supply management are keeping energy import costs elevated for India as an import-dependent economy. Prioritize diversified energy sourcing across crude, LNG, and coal to limit single-corridor exposure. No acute physical shortage is indicated, but freight and insurance premiums warrant active sourcing review across all energy commodities.",
  historical_comparison:
    "Current conditions most closely resemble the 2023-24 Red Sea energy disruption pattern — a prolonged chokepoint risk rather than a sudden supply halt — though Hormuz-specific tension adds a 1990-91 style corridor-closure tail risk for crude and LNG.",
  alternatives: [
    {
      option_number: 1,
      source: "UAE / Saudi Arabia (Gulf Light Crude)",
      commodity: "crude_oil",
      tier: "recommended" as const,
      summary:
        "Primary Gulf-grade crude supply with established Indian refinery compatibility and stable diplomatic ties.",
      detail: [
        "Arab Light / Medium grades align with Jamnagar-class refinery configurations.",
        "Existing long-term contracts reduce spot-market exposure during freight spikes.",
        "Payment and shipping lanes remain operational despite elevated insurance costs.",
      ],
      compatibility: "Compatible, minimal penalty",
      diplomatic_perspective: [
        "Reinforces India's core Gulf partnerships without triggering secondary sanctions exposure.",
        "Visible continuity with established energy diplomacy — low parliamentary or external friction risk.",
      ],
      source_article: null,
    },
    {
      option_number: 2,
      source: "Qatar / Australia (LNG)",
      commodity: "lng",
      tier: "viable" as const,
      summary:
        "Reliable LNG supply with long-term contracts diversifying away from pipeline dependency.",
      detail: [
        "Qatar offers competitive LNG pricing with established regasification infrastructure in India.",
        "Australian LNG provides geographic diversification away from Gulf chokepoints.",
        "Long-term contracts hedge against spot market volatility.",
      ],
      compatibility: "Compatible, minimal infrastructure adjustment needed",
      diplomatic_perspective: [
        "Strengthens energy partnerships beyond the Gulf region.",
        "Provides leverage in broader trade negotiations with both partners.",
      ],
      source_article: null,
    },
    {
      option_number: 3,
      source: "Russia (ESPO Crude / Coal)",
      commodity: "crude_oil",
      tier: "caution" as const,
      summary:
        "Diversification option with attractive pricing but higher geopolitical and payment-complexity exposure.",
      detail: [
        "Longer voyage times from Baltic/Pacific load ports increase freight cost.",
        "Grade mismatch may require blending with Gulf medium sour for optimal yield.",
        "Payment routing and insurance require enhanced compliance review.",
      ],
      compatibility: "Compatible, minor efficiency penalty",
      diplomatic_perspective: [
        "Deepens Russia energy ties — Washington and EU capitals will read this as a strategic signal.",
        "Useful as a price hedge but not as sole replacement for Gulf supply without MEA coordination.",
      ],
      source_article: null,
    },
  ],
  disclaimer:
    "This briefing supports energy procurement decisions for import-dependent economies; it does not replace formal Ministry of External Affairs or trade-policy review. Diplomatic assessments are directional.",
};
