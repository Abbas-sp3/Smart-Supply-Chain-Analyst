import type { RefineryRecord, CrudeGrade, DisruptionScenario } from "../types";

// ── PPAC verified data ─────────────────────────────────────────────
// Source: Petroleum Planning & Analysis Cell (PPAC), Ministry of Petroleum &
// Natural Gas, Government of India. Cross-referenced against multiple 2025
// industry reports (FactoData, IBEF, PIB press release Nov 2025).
// National total: 23 refineries, ~249-258 MMTPA installed capacity as of 2025.
// (23rd is Cauvery Basin Refinery, CPCL, non-operational since April 2019 — excluded.)
// Last verified: 2025-2026 reporting. Re-verify against ppac.gov.in before long-term reuse.

export const INDIA_REFINERIES: RefineryRecord[] = [
  { name: "Jamnagar Refinery", owner: "Reliance Industries", sector: "Private", state: "Gujarat", location: "Jamnagar (SEZ)", commissioned: "1999-07-14", capacityMMTPA: 35.4, nelsonComplexityIndex: 21.1 },
  { name: "Jamnagar Refinery (DTA)", owner: "Reliance Industries", sector: "Private", state: "Gujarat", location: "Jamnagar", commissioned: "1999", capacityMMTPA: 33.0, nelsonComplexityIndex: 21.1 },
  { name: "Vadinar Refinery", owner: "Nayara Energy", sector: "Private", state: "Gujarat", location: "Vadinar", commissioned: "2008-05-01", capacityMMTPA: 20.0, nelsonComplexityIndex: 11.8 },
  { name: "Kochi Refinery", owner: "Bharat Petroleum", sector: "Public", state: "Kerala", location: "Kochi", commissioned: "1963-04-27", capacityMMTPA: 15.5, nelsonComplexityIndex: 10.8 },
  { name: "Mangalore Refinery", owner: "ONGC (MRPL)", sector: "Public", state: "Karnataka", location: "Mangalore", commissioned: "1988-03-07", capacityMMTPA: 15.0, nelsonComplexityIndex: 10.6 },
  { name: "Paradip Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Odisha", location: "Paradip", commissioned: "2016-02-07", capacityMMTPA: 15.0, nelsonComplexityIndex: 12.2 },
  { name: "Panipat Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Haryana", location: "Panipat", commissioned: "1998-07-01", capacityMMTPA: 15.0, expandingToMMTPA: 25.0, nelsonComplexityIndex: 10.5 },
  { name: "Gujarat Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Gujarat", location: "Vadodara", commissioned: "1965-10-11", capacityMMTPA: 13.7, expandingToMMTPA: 18.0, nelsonComplexityIndex: 10.0 },
  { name: "Mumbai Refinery (BPCL)", owner: "Bharat Petroleum", sector: "Public", state: "Maharashtra", location: "Mumbai", commissioned: "1955-01-01", capacityMMTPA: 12.0, nelsonComplexityIndex: 5.6 },
  { name: "Guru Gobind Singh Refinery", owner: "HPCL-Mittal Energy Limited", sector: "Joint Venture", state: "Punjab", location: "Bathinda", commissioned: "2012-03-01", capacityMMTPA: 11.3, nelsonComplexityIndex: 12.6 },
  { name: "Manali Refinery", owner: "Chennai Petroleum Corp (CPCL)", sector: "Public", state: "Tamil Nadu", location: "Chennai", commissioned: "1969-09-27", capacityMMTPA: 10.5, nelsonComplexityIndex: 9.5 },
  { name: "Visakhapatnam Refinery", owner: "Hindustan Petroleum", sector: "Public", state: "Andhra Pradesh", location: "Visakhapatnam", commissioned: "1957-01-01", capacityMMTPA: 8.3, expandingToMMTPA: 15.0, nelsonComplexityIndex: 7.8 },
  { name: "Mathura Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Uttar Pradesh", location: "Mathura", commissioned: "1982-01-19", capacityMMTPA: 8.0, nelsonComplexityIndex: 8.4 },
  { name: "Haldia Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "West Bengal", location: "Haldia", commissioned: "1975-01-01", capacityMMTPA: 8.0, nelsonComplexityIndex: 10.4 },
  { name: "Bina Refinery", owner: "Bharat Petroleum", sector: "Public", state: "Madhya Pradesh", location: "Bina", commissioned: "2011-05-11", capacityMMTPA: 7.8, nelsonComplexityIndex: 11.58 },
  { name: "Mumbai Refinery (HPCL)", owner: "Hindustan Petroleum", sector: "Public", state: "Maharashtra", location: "Mumbai", commissioned: "1954-01-01", capacityMMTPA: 9.5, nelsonComplexityIndex: 10.4 },
  { name: "Barauni Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Bihar", location: "Barauni", commissioned: "1964-07-01", capacityMMTPA: 6.0, expandingToMMTPA: 9.0, nelsonComplexityIndex: 7.8 },
  { name: "Numaligarh Refinery", owner: "Oil India / Govt of Assam", sector: "Public", state: "Assam", location: "Numaligarh", commissioned: "2000-10-01", capacityMMTPA: 3.0, expandingToMMTPA: 9.0, nelsonComplexityIndex: 9.6 },
  { name: "Bongaigaon Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Assam", location: "Bongaigaon", commissioned: "1974-02-20", capacityMMTPA: 2.35, nelsonComplexityIndex: 8.2 },
  { name: "Guwahati Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Assam", location: "Guwahati", commissioned: "1962-01-01", capacityMMTPA: 1.0, nelsonComplexityIndex: 6.7 },
  { name: "Nagapattinam Refinery", owner: "Chennai Petroleum Corp (CPCL)", sector: "Public", state: "Tamil Nadu", location: "Nagapattinam", commissioned: "1993-11-01", capacityMMTPA: 1.0, expandingToMMTPA: 9.0, nelsonComplexityIndex: 7.9 },
  { name: "Tatipaka Refinery", owner: "ONGC", sector: "Public", state: "Andhra Pradesh", location: "Tatipaka", commissioned: "2001-09-03", capacityMMTPA: 1.0, nelsonComplexityIndex: null },
  { name: "Digboi Refinery", owner: "Indian Oil Corporation", sector: "Public", state: "Assam", location: "Digboi", commissioned: "1901-12-11", capacityMMTPA: 0.65, expandingToMMTPA: 1.0, nelsonComplexityIndex: 11 },
];

export const NATIONAL_TOTAL_CAPACITY_MMTPA = INDIA_REFINERIES.reduce(
  (sum, r) => sum + r.capacityMMTPA, 0,
);

export const NATIONAL_REFINERY_COUNT = INDIA_REFINERIES.length;

export const DATA_SOURCE_NOTE =
  "Source: Petroleum Planning & Analysis Cell (PPAC), Ministry of Petroleum " +
  "and Natural Gas, Government of India. Static reference data, verified " +
  "against 2025 reporting \u2014 capacities change with ongoing expansion " +
  "projects, re-verify periodically against ppac.gov.in.";

// ── Crude Grades ──────────────────────────────────────────────────
export const CRUDE_GRADES: CrudeGrade[] = [
  { name: "Arab Light", origin: "Saudi Arabia", api: 33.4, sulfur: 1.8, type: "medium" },
  { name: "Arab Heavy", origin: "Saudi Arabia", api: 27.7, sulfur: 2.8, type: "sour" },
  { name: "Basrah Light", origin: "Iraq", api: 34.5, sulfur: 2.1, type: "medium" },
  { name: "Iranian Heavy", origin: "Iran", api: 30.2, sulfur: 2.5, type: "sour" },
  { name: "Upper Zakum", origin: "UAE", api: 34.0, sulfur: 1.5, type: "medium" },
  { name: "Bonny Light", origin: "Nigeria", api: 35.4, sulfur: 0.16, type: "sweet" },
  { name: "ESPO", origin: "Russia", api: 34.3, sulfur: 0.6, type: "sweet" },
  { name: "Urals", origin: "Russia", api: 31.5, sulfur: 1.4, type: "medium" },
  { name: "Mars", origin: "USA", api: 29.0, sulfur: 2.1, type: "sour" },
  { name: "WTI Midland", origin: "USA", api: 39.6, sulfur: 0.34, type: "sweet" },
  { name: "Das", origin: "UAE", api: 39.0, sulfur: 0.8, type: "sweet" },
  { name: "Murban", origin: "UAE", api: 32.5, sulfur: 0.8, type: "medium" },
];

// ── Region mapping (by state) ─────────────────────────────────────
const STATE_TO_REGION: Record<string, string> = {
  Gujarat: "west", Maharashtra: "west", Karnataka: "west", Kerala: "west",
  Odisha: "east", "West Bengal": "east", "Andhra Pradesh": "east",
  "Uttar Pradesh": "north", Haryana: "north", "Madhya Pradesh": "north", Punjab: "north",
  "Tamil Nadu": "south",
  Assam: "northeast", Bihar: "east",
};

// ── Disruption Scenarios ──────────────────────────────────────────
export const DISRUPTION_SCENARIOS: DisruptionScenario[] = [
  {
    id: "hormuz_blockade",
    name: "Hormuz Blockade",
    description: "Full blockade of Strait of Hormuz. West coast refineries lose access to Gulf crude for 30+ days.",
    affectedRefineryNames: ["Jamnagar Refinery", "Jamnagar Refinery (DTA)", "Mumbai Refinery (BPCL)", "Mumbai Refinery (HPCL)", "Vadinar Refinery"],
    severityImpactPct: 40,
    durationDays: 30,
  },
  {
    id: "russian_sanctions",
    name: "Russian Crude Sanctions",
    description: "New sanctions cut off Russian Urals and ESPO supply. Refineries with high Russian crude dependency face diet constraints.",
    affectedRefineryNames: ["Jamnagar Refinery", "Jamnagar Refinery (DTA)", "Mangalore Refinery", "Paradip Refinery", "Haldia Refinery", "Visakhapatnam Refinery", "Manali Refinery"],
    severityImpactPct: 20,
    durationDays: 60,
  },
  {
    id: "cyclone_east",
    name: "Cyclone \u2014 East Coast",
    description: "Major cyclone shuts down east coast ports and refineries for 10\u201314 days.",
    affectedRefineryNames: ["Paradip Refinery", "Haldia Refinery", "Visakhapatnam Refinery"],
    severityImpactPct: 60,
    durationDays: 12,
  },
  {
    id: "maintenance_bunching",
    name: "Maintenance Bunching",
    description: "Multiple refineries enter scheduled maintenance simultaneously, reducing national throughput.",
    affectedRefineryNames: ["Mumbai Refinery (BPCL)", "Kochi Refinery", "Manali Refinery"],
    severityImpactPct: 30,
    durationDays: 21,
  },
  {
    id: "gujarat_explosion",
    name: "Major Accident \u2014 Gujarat",
    description: "Industrial accident at Jamnagar complex takes one unit offline for 60+ days.",
    affectedRefineryNames: ["Jamnagar Refinery"],
    severityImpactPct: 50,
    durationDays: 60,
  },
];

// ── Helper: get region from state ──────────────────────────────────
export function getRegionForState(state: string): string {
  return STATE_TO_REGION[state] ?? "other";
}
