/**
 * Country Profile Template
 *
 * Copy this file to `src/data/countries/<id>.ts`, fill every field,
 * then register the profile in `src/data/countries/index.ts`.
 *
 * After adding the country, run the isolation test to make sure no
 * cross-country data leaks into RAG results:
 *
 *   npx tsx testCountryIsolation.ts india <your_country_id>
 *
 * ──────────────────────────────────────────────────────────────────────
 * Fields that caused bugs during Singapore's addition (read carefully!)
 * ──────────────────────────────────────────────────────────────────────
 * - KnowledgeGraphEdge.relationship (NOT `.type`) — must be one of the
 *   union: "supplies"|"routes_through"|"depends_on"|"produces"|"imports"|
 *          "threatens"|"can_replace"|"feeds_into"|"operates_at"
 * - DisruptionPreset.label (NOT `.name`) — this is the UI-facing title
 * - DisruptionPreset.category — must be "energy"|"food_agriculture"|
 *   "manufacturing"|"multi_sector"  (NOT "geopolitical")
 * - RangeEstimate requires { min, likely, max, unit } — not just min/max
 * - CrudeAlternative requires { origin, grade, note } — no `region` field
 * - ReserveConfig requires ALL of: normalConsumptionMtpa, maxDailyDrawdownMtpa,
 *   minReserveFloorDays, totalReserveDays, singleEventDrawdownCapacityMtpa,
 *   replenishmentLeadTimeDays
 * - ReserveMechanism.type must be "centralized_facilities" OR
 *   "mandated_stockholding" — NOT "mandated" or "centralized"
 */

import type { CountryProfile } from "./types";

export const templateProfile: CountryProfile = {
  // ── Identity ────────────────────────────────────────────────────────────────
  id: "template",           // e.g. "japan"  — must match COUNTRY_REGISTRY key
  name: "Template Country", // e.g. "Japan"  — used in all LLM prompts
  flag: "🏳️",               // e.g. "🇯🇵" — emoji flag shown in the country selector
  mapView: { center: [135, 35], zoom: 4 }, // [lng, lat] — MapLibre initial view

  // ── Import Dependency ───────────────────────────────────────────────────────
  // Fraction of total crude/energy consumption met by imports (0–100).
  baselineImportDependencyPct: 95,

  // ── Commercial Buffer ────────────────────────────────────────────────────────
  // Estimated aggregate commercial storage capacity in MMt.
  // For mandated-stockholding countries this is private-sector inventory.
  commercialBufferMmt: 5.0,

  // ── Reserve Mechanism ────────────────────────────────────────────────────────
  // Use "centralized_facilities" for state-owned SPR (India-style).
  // Use "mandated_stockholding" for government-mandated private-sector stocks.
  reserveMechanism: {
    type: "mandated_stockholding",
    totalCoverDays: 60,
    details: {
      licensedImporters: ["terminal_a", "terminal_b"],
      minimumStockholdingDays: 60,
      enforcementMechanism: "Describe legal/regulatory basis here",
    },
  },

  // ── Reserve Config (math engine inputs) ────────────────────────────────────
  reserveConfig: {
    normalConsumptionMtpa: 50,               // Normal annual crude intake
    maxDailyDrawdownMtpa: 0.1,              // Max that can be released per day
    minReserveFloorDays: 30,                // Hard floor — never draw below this
    totalReserveDays: 60,                   // Total reserve coverage
    singleEventDrawdownCapacityMtpa: 1.0,   // Max release for a single crisis
    replenishmentLeadTimeDays: 14,          // Days to restock after drawdown
  },

  // ── Trade Graph ─────────────────────────────────────────────────────────────
  // Each node is a KnowledgeGraphNode. Connections must use:
  //   relationship: one of the KnowledgeGraphEdge union values (NOT "type")
  //   strategicWeight: "Critical" | "High" | "Medium" | "Low"
  tradeGraph: [
    {
      id: "corridor_primary",
      type: "corridor",
      label: "Primary Trade Corridor",
      description: "Describe the corridor and its role in imports.",
      aliases: ["alternate name", "short name"],
      capacityMtpa: 500,
      baseUtilizationPct: 75,
      flexibilityFactor: 0.2,
      connections: [
        {
          targetId: "port_primary",
          relationship: "routes_through",  // ← NOT "type"
          strategicWeight: "Critical",
        },
      ],
    },
    {
      id: "port_primary",
      type: "port",
      label: "Primary Port",
      description: "Main import port for crude oil.",
      capacityMtpa: 100,
      baseUtilizationPct: 80,
      connections: [
        {
          targetId: "infra_refinery_primary",
          relationship: "feeds_into",
          strategicWeight: "Critical",
        },
      ],
    },
    {
      id: "infra_refinery_primary",
      type: "infrastructure",
      label: "Primary Refinery Complex",
      description: "Main refining hub.",
      capacityMtpa: 90,
      capacityType: "production_output",
      baseUtilizationPct: 85,
      bufferDays: 14,
      connections: [],
    },
  ],

  // ── Corridor Fractions ──────────────────────────────────────────────────────
  // What % of total imports arrive via each corridor. Values should sum to ~1.0.
  corridorFractions: {
    corridor_primary: 1.0,
  },

  // ── Port-Corridor Fractions ─────────────────────────────────────────────────
  // Format: "port_id:corridor_id" → fraction of that port's supply from that corridor.
  // For each port, fractions across all corridors should sum to 1.0.
  portCorridorFractions: {
    "port_primary:corridor_primary": 1.0,
  },

  // ── Disruption Presets ──────────────────────────────────────────────────────
  // At least one preset is needed for the Scenario Simulator to work.
  // IMPORTANT: use `label` (NOT `name`), category must be one of the 4 values.
  disruptionPresets: [
    {
      id: "primary_corridor_closure",
      label: "Primary Corridor Blockade",         // ← NOT "name"
      description: "Describe the scenario.",
      category: "energy",                          // ← "energy"|"food_agriculture"|"manufacturing"|"multi_sector"
      severityPct: 70,
      severityRange: { min: 50, likely: 70, max: 90, unit: "percent" }, // ← needs likely + unit
      expectedDurationDays: 14,
      durationRange: { min: 7, likely: 14, max: 30, unit: "days" },    // ← needs likely + unit
      affectedNodeIds: ["corridor_primary"],
      spotFreightPenaltyPct: 30,
      insurancePremiumPeakBps: 200,
      premiumDecayModel: "linear_ramp_plateau_decay",
      aisAnomalyThreshold: 10,
      mapCoordinates: [0, 0], // [longitude, latitude] of disruption centre
    },
  ],

  // ── Alternative Sources ──────────────────────────────────────────────────────
  // IMPORTANT: use `origin` and `grade` and `note` — NOT `region`.
  defaultAlternativeSources: [
    {
      id: "alt_source_a",
      name: "Alternative Source A",
      origin: "Country Name",           // ← geographic origin (NOT "region")
      grade: "Light Sweet / Heavy Sour", // ← crude grade description
      priceDiffBbl: 2.0,
      transitDays: 20,
      availabilityScore: 4,             // 1–5 scale (5 = most available)
      gradeCompatibility: "compatible", // "compatible"|"partial"|"incompatible"
      note: "Brief note on route or grade suitability.", // ← required field
    },
  ],

  // \u2500\u2500 Energy Profile \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Used by EnergySupplyOverview, ImportDependencyMetrics, and Refinery page.
  energyProfile: {
    annualConsumptionMtpa: 100,  // total petroleum consumption in million tonnes per annum
    refiningCapacityMtpa: 80,   // installed nameplate refining capacity
    currentUtilizationPct: 80,  // % of capacity currently in use
    importSharePct: 95,          // % of crude met by imports (0\u2013100)
    dataSource: "Template \u2014 replace with IEA / EMA / ministry source and year",
    supplierMix: [
      {
        commodity: "Crude",
        suppliers: [
          { name: "Supplier A", pct: 60 },
          { name: "Supplier B", pct: 40 },
        ],
      },
    ],
  },
};
