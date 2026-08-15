import { CountryProfile } from "./types";
import { INDIA_TRADE_GRAPH } from "@/features/geopolitical-intelligence/knowledge-graph/tradeGraph";
import { CRUDE_ALTERNATIVES } from "@/features/procurement/data/alternativeSources";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { 
  INDIA_RESERVE_CONFIG, 
  ISPRL_PHASE_1_FACILITIES, 
  ISPRL_CURRENT_STATE 
} from "@/features/scenario-simulator/constants/reserve-config";

export const indiaProfile: CountryProfile = {
  id: "india",
  name: "India",
  flag: "🇮🇳",
  mapView: { center: [75, 15], zoom: 2.2 },
  
  baselineImportDependencyPct: 88,
  
  corridorFractions: {
    corridor_hormuz: 0.22,
    corridor_bab_el_mandeb: 0.08,
    corridor_suez: 0.05,
    corridor_malacca: 0.06,
    corridor_south_china_sea: 0.04,
    corridor_black_sea: 0.15,
    corridor_cape_good_hope: 0.04,
  },
  
  portCorridorFractions: {
    "port_jnpt:corridor_suez": 0.35,
    "port_mundra:corridor_suez": 0.17,
    "port_kochi:corridor_suez": 0.30,
    "port_kandla:corridor_suez": 0.15,
    "port_mundra:corridor_hormuz": 0.55,
    "port_kandla:corridor_hormuz": 0.60,
    "port_mangalore:corridor_hormuz": 0.85,
    "port_jnpt:corridor_hormuz": 0.08,
    "port_kochi:corridor_hormuz": 0.40,
    "port_chennai:corridor_malacca": 0.45,
    "port_vizag:corridor_malacca": 0.40,
    "port_kolkata:corridor_malacca": 0.35,
    "port_ennore:corridor_malacca": 0.25,
  },
  
  tradeGraph: INDIA_TRADE_GRAPH,
  disruptionPresets: DISRUPTION_PRESETS,
  
  reserveConfig: INDIA_RESERVE_CONFIG,
  reserveMechanism: {
    type: "centralized_facilities",
    totalCoverDays: ISPRL_CURRENT_STATE.currentCoverDays,
    details: {
      facilities: ISPRL_PHASE_1_FACILITIES,
      nationalFillPercent: ISPRL_CURRENT_STATE.nationalFillPercent,
      currentFillMmt: ISPRL_CURRENT_STATE.currentFillMmt,
      policyNormDays: ISPRL_CURRENT_STATE.ieaNormDays,
    },
  },
  commercialBufferMmt: 31.8,
  
  defaultAlternativeSources: CRUDE_ALTERNATIVES,

  // ── Energy Profile — PPAC 2023-24 ─────────────────────────────────────────
  energyProfile: {
    annualConsumptionMtpa: 258,
    refiningCapacityMtpa: 253.9,
    currentUtilizationPct: 101.5,
    importSharePct: 85,
    dataSource: "PPAC 2023-24",
    supplierMix: [
      {
        commodity: "Crude",
        suppliers: [
          { name: "Russia", pct: 35 },
          { name: "Iraq", pct: 20 },
          { name: "Saudi Arabia", pct: 15 },
          { name: "UAE", pct: 10 },
          { name: "Others", pct: 20 },
        ],
      },
      {
        commodity: "LNG",
        suppliers: [
          { name: "Qatar", pct: 45 },
          { name: "USA", pct: 15 },
          { name: "UAE", pct: 12 },
          { name: "Others", pct: 28 },
        ],
      },
      {
        commodity: "Coal",
        suppliers: [
          { name: "Indonesia", pct: 45 },
          { name: "Australia", pct: 25 },
          { name: "South Africa", pct: 15 },
          { name: "Others", pct: 15 },
        ],
      },
    ],
  },
};

