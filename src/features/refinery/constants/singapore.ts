/**
 * Singapore Refinery & Processing — Static Reference Data
 *
 * Sources:
 *  - Energy Market Authority (EMA) Singapore — Annual Energy Statistics 2023
 *  - International Energy Agency (IEA) — Oil Information 2023
 *  - Shell Global — Pulau Bukom site data
 *  - ExxonMobil Singapore — Jurong Island operations
 *  - Singapore Refining Company (SRC) / PCS (Petrochemical Corporation of Singapore)
 *  - Petroleum Association of Japan / AIPN benchmarks for Nelson Complexity
 *  - MPA Singapore (Marine Port Authority) — port throughput data
 * Re-verify capacities against EMA annual report before long-term reuse.
 */

// ── Type Definitions ─────────────────────────────────────────────────────────
export type SgRefineryRecord = {
  id: string;
  name: string;
  operator: string;
  parentCompany: string;
  ownership: string;
  island: "Jurong Island" | "Pulau Bukom" | "Jurong Industrial Estate";
  commissioned: string;
  capacityMMTPA: number;
  crudeDistillationCapBPD: number;   // barrels per day
  nelsonComplexityIndex: number;
  utilizationPct: number;
  feedstockBuffer: number;           // days of feedstock buffer
  primaryCrudeGrades: string[];
  outputProducts: { name: string; pctOfOutput: number }[];
  upgradeUnits: string[];
  status: "operational" | "expanding" | "converting" | "legacy";
  notes?: string;
};

export type SgCrudeGrade = {
  name: string;
  origin: string;
  apiGravity: number;
  sulfurPct: number;
  type: "sweet" | "medium" | "sour";
  mideastShare: boolean;
  importSharePct: number;
  compatibleRefineries: string[];
  transitDaysMalacca: number;
};

export type SgDisruptionScenario = {
  id: string;
  name: string;
  description: string;
  triggerNode: string;
  severityPct: number;
  durationDays: number;
  atRiskCapacityMMTPA: number;
  atRiskReasoningNote: string;
  priceImpactPct: { low: number; high: number };
  affectedRefineries: string[];
  productImpacts: { product: string; impactPct: number }[];
};

export type SgFeedstockFlow = {
  supplier: string;
  origin: string;
  route: string;
  grade: string;
  shareOfImportsPct: number;
  transitDays: number;
  chokepoints: string[];
};

// ── Refinery Records ──────────────────────────────────────────────────────────
export const SINGAPORE_REFINERIES: SgRefineryRecord[] = [
  {
    id: "jurong_exxon",
    name: "ExxonMobil Jurong Island Refinery",
    operator: "ExxonMobil Asia Pacific",
    parentCompany: "ExxonMobil Corporation",
    ownership: "100% ExxonMobil",
    island: "Jurong Island",
    commissioned: "1966",
    capacityMMTPA: 25.0,
    crudeDistillationCapBPD: 592_000,
    nelsonComplexityIndex: 14.8,
    utilizationPct: 87,
    feedstockBuffer: 14,
    primaryCrudeGrades: ["Arab Light", "Arab Medium", "Murban", "Upper Zakum", "Basrah Light"],
    outputProducts: [
      { name: "Gasoline / Naphtha", pctOfOutput: 22 },
      { name: "Jet Fuel / Kerosene", pctOfOutput: 18 },
      { name: "Diesel / Gas Oil", pctOfOutput: 28 },
      { name: "Fuel Oil / Bunker", pctOfOutput: 16 },
      { name: "Petrochemical Feedstocks", pctOfOutput: 11 },
      { name: "LPG / Others", pctOfOutput: 5 },
    ],
    upgradeUnits: [
      "Fluid Catalytic Cracker (FCC)",
      "Hydrotreater",
      "Vacuum Distillation Unit",
      "Reformer",
      "Alkylation Unit",
    ],
    status: "operational",
    notes: "Asia's largest integrated refinery-chemicals complex. Primarily processes Middle Eastern sour crudes.",
  },
  {
    id: "jurong_src",
    name: "Singapore Refining Company (SRC)",
    operator: "Singapore Refining Company",
    parentCompany: "SRC (Chevron 50% / Pertamina 50%)",
    ownership: "Chevron 50% · Pertamina 50%",
    island: "Jurong Island",
    commissioned: "1973",
    capacityMMTPA: 20.0,
    crudeDistillationCapBPD: 285_000,
    nelsonComplexityIndex: 11.2,
    utilizationPct: 83,
    feedstockBuffer: 12,
    primaryCrudeGrades: ["Minas (Indonesia)", "Attaka (Indonesia)", "Das (UAE)", "Arab Light", "ESPO (Russia)"],
    outputProducts: [
      { name: "Diesel / Gas Oil", pctOfOutput: 30 },
      { name: "Jet Fuel / Kerosene", pctOfOutput: 20 },
      { name: "Fuel Oil / Bunker", pctOfOutput: 22 },
      { name: "Gasoline / Naphtha", pctOfOutput: 18 },
      { name: "LPG / Others", pctOfOutput: 10 },
    ],
    upgradeUnits: [
      "Fluid Catalytic Cracker (FCC)",
      "Hydrotreater",
      "Vacuum Distillation Unit",
      "Naphtha Reformer",
    ],
    status: "operational",
    notes: "Processes a broader range of crude grades including regional Southeast Asian blends and opportunistic Russian crude.",
  },
  {
    id: "bukom_shell",
    name: "Shell Pulau Bukom Refinery",
    operator: "Shell Eastern Petroleum",
    parentCompany: "Shell plc",
    ownership: "Shell 84% · Temasek Holdings 16%",
    island: "Pulau Bukom",
    commissioned: "1961",
    capacityMMTPA: 25.0,
    crudeDistillationCapBPD: 500_000,
    nelsonComplexityIndex: 12.5,
    utilizationPct: 80,
    feedstockBuffer: 14,
    primaryCrudeGrades: ["Arab Light", "Arab Heavy", "Basrah Light", "Bonny Light (Nigeria)", "Das (UAE)"],
    outputProducts: [
      { name: "Fuel Oil / Marine Bunker", pctOfOutput: 25 },
      { name: "Diesel / Gas Oil", pctOfOutput: 26 },
      { name: "Jet Fuel / Aviation Fuel", pctOfOutput: 19 },
      { name: "Gasoline", pctOfOutput: 15 },
      { name: "Petrochemicals / Aromatics", pctOfOutput: 10 },
      { name: "LPG / Others", pctOfOutput: 5 },
    ],
    upgradeUnits: [
      "Residue Fluid Catalytic Cracker (RFCC)",
      "Hydrocracker",
      "Vacuum Distillation Unit",
      "Hydrotreater",
      "Continuous Catalytic Reformer",
      "Delayed Coker",
    ],
    status: "operational",
    notes: "World's largest single-site Shell refinery. A global bunkering anchor — Singapore supplies ~20% of world marine fuel.",
  },
];

// ── Crude Grade Compatibility ─────────────────────────────────────────────────
export const SG_CRUDE_GRADES: SgCrudeGrade[] = [
  {
    name: "Arab Light",
    origin: "Saudi Arabia",
    apiGravity: 33.4, sulfurPct: 1.8, type: "medium",
    mideastShare: true, importSharePct: 30,
    compatibleRefineries: ["jurong_exxon", "jurong_src", "bukom_shell"],
    transitDaysMalacca: 12,
  },
  {
    name: "Arab Medium / Arab Heavy",
    origin: "Saudi Arabia",
    apiGravity: 29.5, sulfurPct: 2.6, type: "sour",
    mideastShare: true, importSharePct: 12,
    compatibleRefineries: ["jurong_exxon", "bukom_shell"],
    transitDaysMalacca: 12,
  },
  {
    name: "Murban",
    origin: "UAE (ADNOC)",
    apiGravity: 38.5, sulfurPct: 0.78, type: "medium",
    mideastShare: true, importSharePct: 14,
    compatibleRefineries: ["jurong_exxon", "jurong_src", "bukom_shell"],
    transitDaysMalacca: 11,
  },
  {
    name: "Upper Zakum / Das",
    origin: "UAE (ADNOC)",
    apiGravity: 34.5, sulfurPct: 1.5, type: "medium",
    mideastShare: true, importSharePct: 8,
    compatibleRefineries: ["jurong_exxon", "jurong_src"],
    transitDaysMalacca: 11,
  },
  {
    name: "Basrah Light",
    origin: "Iraq (SOMO)",
    apiGravity: 34.5, sulfurPct: 2.0, type: "medium",
    mideastShare: true, importSharePct: 10,
    compatibleRefineries: ["jurong_exxon", "bukom_shell"],
    transitDaysMalacca: 12,
  },
  {
    name: "Minas / Duri",
    origin: "Indonesia (Pertamina)",
    apiGravity: 35.2, sulfurPct: 0.08, type: "sweet",
    mideastShare: false, importSharePct: 6,
    compatibleRefineries: ["jurong_src"],
    transitDaysMalacca: 2,
  },
  {
    name: "ESPO Blend",
    origin: "Russia (Transneft)",
    apiGravity: 34.3, sulfurPct: 0.6, type: "sweet",
    mideastShare: false, importSharePct: 7,
    compatibleRefineries: ["jurong_src", "bukom_shell"],
    transitDaysMalacca: 5,
  },
  {
    name: "Bonny Light",
    origin: "Nigeria",
    apiGravity: 35.4, sulfurPct: 0.16, type: "sweet",
    mideastShare: false, importSharePct: 4,
    compatibleRefineries: ["bukom_shell"],
    transitDaysMalacca: 22,
  },
  {
    name: "WTI Midland / Mars",
    origin: "United States",
    apiGravity: 36.5, sulfurPct: 0.75, type: "medium",
    mideastShare: false, importSharePct: 3,
    compatibleRefineries: ["jurong_exxon", "bukom_shell"],
    transitDaysMalacca: 42,
  },
];

// ── Feedstock Supply Chain ────────────────────────────────────────────────────
export const SG_FEEDSTOCK_FLOWS: SgFeedstockFlow[] = [
  {
    supplier: "Saudi Aramco", origin: "Saudi Arabia",
    route: "Persian Gulf → Strait of Hormuz → Indian Ocean → Strait of Malacca → Singapore",
    grade: "Arab Light / Arab Medium", shareOfImportsPct: 30,
    transitDays: 12, chokepoints: ["Strait of Hormuz", "Strait of Malacca"],
  },
  {
    supplier: "ADNOC (UAE)", origin: "UAE",
    route: "Persian Gulf → Strait of Hormuz → Indian Ocean → Strait of Malacca → Singapore",
    grade: "Murban / Upper Zakum / Das", shareOfImportsPct: 22,
    transitDays: 11, chokepoints: ["Strait of Hormuz", "Strait of Malacca"],
  },
  {
    supplier: "SOMO (Iraq)", origin: "Iraq",
    route: "Basra → Strait of Hormuz → Indian Ocean → Strait of Malacca → Singapore",
    grade: "Basrah Light", shareOfImportsPct: 10,
    transitDays: 13, chokepoints: ["Strait of Hormuz", "Strait of Malacca"],
  },
  {
    supplier: "Pertamina", origin: "Indonesia",
    route: "Java Sea → Singapore Strait",
    grade: "Minas / Duri / Cinta", shareOfImportsPct: 6,
    transitDays: 2, chokepoints: [],
  },
  {
    supplier: "Transneft / Rosneft", origin: "Russia",
    route: "Pacific Coast → Sea of Japan → South China Sea → Singapore",
    grade: "ESPO Blend", shareOfImportsPct: 7,
    transitDays: 5, chokepoints: ["South China Sea"],
  },
  {
    supplier: "NNPC (Nigeria)", origin: "West Africa",
    route: "Bonny Terminal → Atlantic → Cape of Good Hope → Indian Ocean → Strait of Malacca → Singapore",
    grade: "Bonny Light / Qua Iboe", shareOfImportsPct: 4,
    transitDays: 22, chokepoints: ["Strait of Malacca"],
  },
];

// ── Disruption Scenarios ──────────────────────────────────────────────────────
export const SG_DISRUPTION_SCENARIOS: SgDisruptionScenario[] = [
  {
    id: "malacca_blockade",
    name: "Strait of Malacca Full Blockade",
    description: "Major maritime blockade severing 80%+ of inbound crude to Singapore. All three refineries face feedstock starvation within 14 days of buffer exhaustion.",
    triggerNode: "corridor_malacca",
    severityPct: 80,
    durationDays: 45,
    atRiskCapacityMMTPA: 56.0,
    atRiskReasoningNote: "All three refineries source via Malacca. Buffer of 12–14 days; after that, run-cut begins.",
    priceImpactPct: { low: 12, high: 35 },
    affectedRefineries: ["jurong_exxon", "jurong_src", "bukom_shell"],
    productImpacts: [
      { product: "Marine Bunker Fuel", impactPct: 85 },
      { product: "Jet Fuel (Changi)", impactPct: 70 },
      { product: "Diesel / Gas Oil", impactPct: 60 },
      { product: "Gasoline", impactPct: 40 },
    ],
  },
  {
    id: "hormuz_tensions",
    name: "Strait of Hormuz Military Tensions",
    description: "Naval standoffs restrict Persian Gulf crude exports. Rerouting via Cape of Good Hope adds 25+ days transit. Market price premium absorbs partial volumes.",
    triggerNode: "corridor_hormuz",
    severityPct: 45,
    durationDays: 60,
    atRiskCapacityMMTPA: 39.2,
    atRiskReasoningNote: "~56% of Singapore crude from Middle East routes through Hormuz. 45% partial disruption.",
    priceImpactPct: { low: 8, high: 22 },
    affectedRefineries: ["jurong_exxon", "bukom_shell"],
    productImpacts: [
      { product: "Marine Bunker Fuel", impactPct: 45 },
      { product: "Jet Fuel (Changi)", impactPct: 38 },
      { product: "Diesel / Gas Oil", impactPct: 30 },
    ],
  },
  {
    id: "jurong_major_incident",
    name: "Jurong Island Major Refinery Incident",
    description: "Fire or explosion at ExxonMobil or SRC unit triggers process shutdown. Singapore Emergency Petroleum Supply Scheme (SPSS) and neighboring refinery swing activated.",
    triggerNode: "infra_refinery_jurong",
    severityPct: 55,
    durationDays: 60,
    atRiskCapacityMMTPA: 24.75,
    atRiskReasoningNote: "Jurong complex = 45 MMTPA. 55% severity = ~24.75 MMTPA disrupted output.",
    priceImpactPct: { low: 6, high: 15 },
    affectedRefineries: ["jurong_exxon", "jurong_src"],
    productImpacts: [
      { product: "Petrochemical Feedstocks", impactPct: 80 },
      { product: "Gasoline / Naphtha", impactPct: 55 },
      { product: "Diesel / Gas Oil", impactPct: 35 },
    ],
  },
  {
    id: "south_china_sea_escalation",
    name: "South China Sea Military Escalation",
    description: "Commercial vessels reroute via Lombok / Sunda Straits. East Asian crude supplies disrupted; ESPO flows impacted.",
    triggerNode: "corridor_south_china_sea",
    severityPct: 40,
    durationDays: 30,
    atRiskCapacityMMTPA: 19.6,
    atRiskReasoningNote: "~28% of crude routes through SCS; 40% disruption severity.",
    priceImpactPct: { low: 5, high: 14 },
    affectedRefineries: ["jurong_src", "bukom_shell"],
    productImpacts: [
      { product: "ESPO-Derived Products", impactPct: 70 },
      { product: "Fuel Oil / Marine Bunker", impactPct: 25 },
    ],
  },
  {
    id: "malacca_piracy",
    name: "Malacca Strait — Piracy & Terrorism",
    description: "Coordinated piracy and maritime terrorism in Malacca. VLCCs reroute via Lombok. Insurance war-risk premiums spike 300–500 bps.",
    triggerNode: "corridor_malacca",
    severityPct: 25,
    durationDays: 45,
    atRiskCapacityMMTPA: 17.5,
    atRiskReasoningNote: "Partial disruption — roughly 25% of Malacca traffic affected by piracy rerouting.",
    priceImpactPct: { low: 3, high: 9 },
    affectedRefineries: ["jurong_src", "bukom_shell"],
    productImpacts: [
      { product: "Marine Bunker Fuel", impactPct: 20 },
      { product: "Diesel", impactPct: 15 },
    ],
  },
];

// ── Capacity Aggregates ───────────────────────────────────────────────────────
export const SG_TOTAL_CAPACITY_MMTPA = SINGAPORE_REFINERIES.reduce(
  (sum, r) => sum + r.capacityMMTPA, 0
);

export const SG_TOTAL_CDU_BPD = SINGAPORE_REFINERIES.reduce(
  (sum, r) => sum + r.crudeDistillationCapBPD, 0
);

export const SG_AVG_NCI = (
  SINGAPORE_REFINERIES.reduce((sum, r) => sum + r.nelsonComplexityIndex, 0) /
  SINGAPORE_REFINERIES.length
).toFixed(1);

export const SG_AVG_UTIL = (
  SINGAPORE_REFINERIES.reduce((sum, r) => sum + r.utilizationPct, 0) /
  SINGAPORE_REFINERIES.length
).toFixed(0);

// ── Refinery Throughput Profile ───────────────────────────────────────────────
// Singapore's ~70 MMTPA refining capacity vs ~35 MMTPA domestic demand
// = 50% of output is exported to regional Asian markets (China, Japan, Australia, India)
export const SG_REFINERY_THROUGHPUT_PROFILE = {
  totalInstalledCapacityMMTPA: SG_TOTAL_CAPACITY_MMTPA,
  domesticConsumptionMMTPA: 35.0,      // approximate annual domestic demand
  exportSharePct: 50,                   // half of output exported
  bunkering_export_MMTPA: 14.0,        // world's largest bunkering hub: ~50M tonnes/year marine fuel
  primaryExportMarkets: ["China", "Japan", "Australia", "Indonesia", "South Korea", "India"],
};

export const DATA_SOURCE_NOTE_SG =
  "Source: Energy Market Authority (EMA) Singapore 2023 · Shell Eastern Petroleum · " +
  "ExxonMobil Asia Pacific · IEA Oil Information 2023 · MPA Singapore (Marine Port Authority). " +
  "Capacities as of 2024–2025 — verify against EMA annual report before reuse.";
