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
    title: "India Diversifies Crude Sources Amid Red Sea Shipping Disruptions",
    description:
      "Indian refiners are increasing Russian and West African crude purchases as Red Sea rerouting raises freight costs on traditional Gulf-Europe-India lanes.",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: "Reuters",
    url: "https://example.com/india-diversification",
  },
];

export const MOCK_PROCUREMENT_BRIEFING = {
  executive_summary:
    "Gulf shipping risk and OPEC+ supply management are keeping India's crude import costs elevated. Refiners should prioritize proven Gulf-grade suppliers while maintaining secondary options that limit single-corridor exposure. No acute physical shortage is indicated, but freight and insurance premiums warrant active sourcing review.",
  historical_comparison:
    "Current conditions most closely resemble the 2023–24 Red Sea security disruption pattern — a prolonged chokepoint risk rather than a sudden supply halt — though Hormuz-specific tension adds a 1990–91 style corridor-closure tail risk.",
  alternatives: [
    {
      option_number: 1,
      source: "UAE / Saudi Arabia (Gulf Light)",
      tier: "recommended" as const,
      summary:
        "Primary Gulf-grade supply with established Indian refinery compatibility and stable diplomatic ties.",
      detail: [
        "Arab Light / Medium grades align with Jamnagar-class refinery configurations.",
        "Existing long-term contracts reduce spot-market exposure during freight spikes.",
        "Payment and shipping lanes remain operational despite elevated insurance costs.",
      ],
      refinery_compatibility: "Compatible, minimal penalty",
      diplomatic_perspective: [
        "Reinforces India's core Gulf partnerships without triggering secondary sanctions exposure.",
        "Visible continuity with established energy diplomacy — low parliamentary or external friction risk.",
      ],
      source_article: null,
    },
    {
      option_number: 2,
      source: "Iraq (Basra Light)",
      tier: "viable" as const,
      summary:
        "Cost-competitive medium sour crude with strong refinery fit, subject to regional security volatility.",
      detail: [
        "Basra Light is widely processed by Indian refineries with minor blending adjustments.",
        "Pricing often undercuts Saudi Arab Light on spot markets.",
        "Loading and transit depend on Persian Gulf security conditions.",
      ],
      refinery_compatibility: "Compatible, minor efficiency penalty",
      diplomatic_perspective: [
        "Supports Iraq trade ties without major alignment shifts.",
        "Regional conflict spillover remains the primary diplomatic monitoring concern.",
      ],
      source_article: null,
    },
    {
      option_number: 3,
      source: "Russia (ESPO / Urals blend)",
      tier: "caution" as const,
      summary:
        "Diversification option with attractive pricing but higher geopolitical and payment-complexity exposure.",
      detail: [
        "Longer voyage times from Baltic/Pacific load ports increase freight cost.",
        "Grade mismatch may require blending with Gulf medium sour for optimal yield.",
        "Payment routing and insurance require enhanced compliance review.",
      ],
      refinery_compatibility: "Compatible, minor efficiency penalty",
      diplomatic_perspective: [
        "Deepens Russia trade ties — Washington and EU capitals will read this as a strategic signal.",
        "Useful as a price hedge but not as sole replacement for Gulf supply without MEA coordination.",
      ],
      source_article: null,
    },
  ],
  critical_cargo: null,
  disclaimer:
    "This briefing supports procurement decisions; it does not replace formal Ministry of External Affairs or trade-policy review. Diplomatic assessments are directional.",
};
