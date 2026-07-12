/**
 * Disruption Event Library
 *
 * Every scenario is a data record — no bespoke engine code per scenario.
 * The propagation engine reads these presets and drives the computation.
 *
 * Severity / duration figures are calibrated against:
 *   - EIA World Chokepoints for Global Energy Security 2025
 *   - IMF PortWatch disruption analytics 2024
 *   - UNCTAD Review of Maritime Transport 2023-24
 *   - Lloyd's List / BIMCO freight market analyses
 *   - Oxford Analytica geopolitical disruption studies
 *
 * Phase 2 requirement: the Ever Given calibration case (preset id "suez_partial_blockage")
 * is the regression test. Engine ETA shift and supply gap MUST land in the
 * reportedEtaShiftDays / reportedSupplyGapMtpa ranges before Phase 2 ships.
 */

import type { DisruptionPreset } from "../types";

export const DISRUPTION_PRESETS: DisruptionPreset[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. STRAIT OF HORMUZ — Partial Closure (Heightened Tensions)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hormuz_partial",
    label: "Strait of Hormuz — Partial Closure (Heightened Tensions)",
    description:
      "Naval standoff or Iranian interdiction reduces tanker traffic by 30–50%. Oil tankers slow-steam or anchor; LNG carriers reroute.",
    affectedNodeIds: [
      "corridor_hormuz",
      "port_mundra",
      "port_kandla",
      "port_jnpt",
      "port_mangalore",
      "infra_refineries_west",
    ],
    severityPct: 40,
    severityRange: { min: 30, likely: 40, max: 55, unit: "percent" },
    expectedDurationDays: 21,
    durationRange: { min: 7, likely: 21, max: 60, unit: "days" },
    spotFreightPenaltyPct: 45,
    insurancePremiumPeakBps: 250,
    premiumDecayModel: "linear_ramp_plateau_decay",
    aisAnomalyThreshold: 40,
    mapCoordinates: [56.283, 26.566],
    category: "energy",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. STRAIT OF HORMUZ — Full Closure
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hormuz_full_closure",
    label: "Strait of Hormuz — Full Closure (Armed Conflict)",
    description:
      "Complete maritime blockade of Hormuz. All tanker traffic halted. India's Gulf crude supply (65%+ of imports) disrupted.",
    affectedNodeIds: [
      "corridor_hormuz",
      "port_mundra",
      "port_kandla",
      "port_jnpt",
      "port_mangalore",
      "port_kochi",
      "infra_refineries_west",
      "infra_refineries_south",
    ],
    severityPct: 95,
    severityRange: { min: 85, likely: 95, max: 100, unit: "percent" },
    expectedDurationDays: 14,
    durationRange: { min: 7, likely: 14, max: 45, unit: "days" },
    spotFreightPenaltyPct: 120,
    insurancePremiumPeakBps: 800,
    premiumDecayModel: "linear_ramp_plateau_decay",
    aisAnomalyThreshold: 80,
    mapCoordinates: [56.283, 26.566],
    category: "energy",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. BAB-EL-MANDEB / RED SEA — Active Interdiction (Houthi-style)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "red_sea_interdiction",
    label: "Bab-el-Mandeb / Red Sea — Active Interdiction",
    description:
      "Drone/missile attacks on commercial vessels. Major carriers reroute via Cape of Good Hope, adding 10–14 days and ~25% freight cost.",
    affectedNodeIds: [
      "corridor_bab_el_mandeb",
      "corridor_suez",
      "port_jnpt",
      "port_mundra",
      "port_kochi",
    ],
    severityPct: 65,
    severityRange: { min: 50, likely: 65, max: 80, unit: "percent" },
    expectedDurationDays: 90,
    durationRange: { min: 30, likely: 90, max: 365, unit: "days" },
    spotFreightPenaltyPct: 28,
    insurancePremiumPeakBps: 180,
    premiumDecayModel: "linear_ramp_plateau_decay",
    aisAnomalyThreshold: 35,
    mapCoordinates: [43.408, 12.583],
    category: "multi_sector",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. SUEZ CANAL — Full Blockage (Ever Given calibration case)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "suez_partial_blockage",
    label: "Suez Canal — Full Blockage (Vessel Grounding)",
    description:
      "Single vessel grounding closes the canal completely for 3–10 days. All traffic must queue or reroute via Cape of Good Hope.",
    affectedNodeIds: [
      "corridor_suez",
      "corridor_bab_el_mandeb",
      "port_jnpt",
      "port_mundra",
    ],
    severityPct: 100,
    severityRange: { min: 95, likely: 100, max: 100, unit: "percent" },
    expectedDurationDays: 6,
    durationRange: { min: 3, likely: 6, max: 14, unit: "days" },
    spotFreightPenaltyPct: 18,
    insurancePremiumPeakBps: 60,
    premiumDecayModel: "flat",
    aisAnomalyThreshold: 20,
    mapCoordinates: [32.348, 30.585],
    category: "multi_sector",
    /**
     * PHASE 2 REGRESSION TEST CASE.
     * The 2021 Ever Given grounding (23 Mar – 29 Mar 2021, 6 days).
     * Engine ETA shift and supply gap MUST fall within these reported ranges
     * before Phase 2 is considered complete.
     * Source: Lloyd's List, UNCTAD, Oxford Economics post-event analyses.
     */
    historicalCalibrationCase: {
      eventName: "Ever Given / Suez Canal Grounding",
      year: 2021,
      actualDurationDays: 6,
      reportedEtaShiftDays: {
        min: 6,
        likely: 10,
        max: 20,
        unit: "days",
      },
      reportedSupplyGapMtpa: {
        // ~$9.6B/day in global trade halted; India-specific volume ~0.3–0.6 Mtpa equivalent
        min: 0.1,
        likely: 0.35,
        max: 0.6,
        unit: "Mtpa",
      },
      sourceDescription:
        "Lloyd's List 'One Week, One Ship, $9.6B' analysis; UNCTAD ad hoc note on the Suez Canal obstruction 2021; Oxford Economics global trade impact brief.",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. STRAIT OF MALACCA — Congestion / Partial Closure
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "malacca_congestion",
    label: "Strait of Malacca — Severe Congestion / Partial Closure",
    description:
      "Extreme congestion at Singapore hub or partial closure due to incident. Semiconductors, electronics, and palm oil flows to east coast ports disrupted.",
    affectedNodeIds: [
      "corridor_malacca",
      "port_chennai",
      "port_vizag",
      "port_kolkata",
      "port_ennore",
    ],
    severityPct: 35,
    severityRange: { min: 20, likely: 35, max: 55, unit: "percent" },
    expectedDurationDays: 14,
    durationRange: { min: 7, likely: 14, max: 30, unit: "days" },
    spotFreightPenaltyPct: 22,
    insurancePremiumPeakBps: 80,
    premiumDecayModel: "linear_ramp_plateau_decay",
    aisAnomalyThreshold: 30,
    mapCoordinates: [100.916, 2.793],
    category: "manufacturing",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. SOUTH CHINA SEA — Military Escalation
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "south_china_sea_escalation",
    label: "South China Sea — Military Escalation / Taiwan Strait Crisis",
    description:
      "Naval blockade or military exercises force commercial rerouting. Semiconductor and electronics supply chains severely disrupted. No-sail zones reduce corridor capacity by 40–60%.",
    affectedNodeIds: [
      "corridor_south_china_sea",
      "corridor_malacca",
      "port_chennai",
      "port_vizag",
    ],
    severityPct: 50,
    severityRange: { min: 35, likely: 50, max: 70, unit: "percent" },
    expectedDurationDays: 30,
    durationRange: { min: 14, likely: 30, max: 90, unit: "days" },
    spotFreightPenaltyPct: 55,
    insurancePremiumPeakBps: 400,
    premiumDecayModel: "linear_ramp_plateau_decay",
    aisAnomalyThreshold: 50,
    mapCoordinates: [112.5, 12.0],
    category: "manufacturing",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. BLACK SEA — Extended Conflict / Port Closure
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "black_sea_conflict",
    label: "Black Sea — Extended Conflict / Grain & Fertilizer Blockade",
    description:
      "Continued conflict or mine hazards halt grain and fertilizer exports from Russia/Ukraine. India's fertilizer security and edible oil imports threatened.",
    affectedNodeIds: [
      "corridor_black_sea",
      "infra_fertilizer_plants",
    ],
    severityPct: 70,
    severityRange: { min: 50, likely: 70, max: 90, unit: "percent" },
    expectedDurationDays: 180,
    durationRange: { min: 60, likely: 180, max: 540, unit: "days" },
    spotFreightPenaltyPct: 35,
    insurancePremiumPeakBps: 300,
    premiumDecayModel: "linear_ramp_plateau_decay",
    aisAnomalyThreshold: 25,
    mapCoordinates: [34.0, 43.0],
    category: "food_agriculture",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. CAPE OF GOOD HOPE — Surge Rerouting Capacity Stress
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "cape_reroute_surge",
    label: "Cape of Good Hope — Rerouting Surge (Red Sea / Suez Closure)",
    description:
      "Concurrent Red Sea closure forces >30% of India-Europe trade via Cape route. Longer transit adds 12–14 days; bunker fuel costs surge; Durban / Port Louis transshipment hubs congest.",
    affectedNodeIds: [
      "corridor_cape_good_hope",
      "corridor_bab_el_mandeb",
      "corridor_suez",
      "port_jnpt",
      "port_mundra",
      "port_kochi",
    ],
    severityPct: 25, // Cape itself not closed; effect is indirect cost/delay
    severityRange: { min: 15, likely: 25, max: 40, unit: "percent" },
    expectedDurationDays: 90,
    durationRange: { min: 30, likely: 90, max: 365, unit: "days" },
    spotFreightPenaltyPct: 30,
    insurancePremiumPeakBps: 45,
    premiumDecayModel: "flat",
    aisAnomalyThreshold: 30,
    mapCoordinates: [18.472, -34.358],
    category: "multi_sector",
  },
];

/** Lookup a preset by ID. Returns undefined if not found. */
export function getPresetById(id: string): DisruptionPreset | undefined {
  return DISRUPTION_PRESETS.find((p) => p.id === id);
}

/** All preset IDs — useful for validation in API routes. */
export const PRESET_IDS = DISRUPTION_PRESETS.map((p) => p.id) as readonly string[];
