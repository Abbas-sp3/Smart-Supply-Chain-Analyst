/**
 * alternativeSources.ts — Static dataset of crude sourcing alternatives
 *
 * ILLUSTRATIVE DEMO DATA — not live market data.
 * Figures are calibrated from:
 *  - Platts / Argus crude differential publications (2024 averages)
 *  - PPAC India crude import data FY2024
 *  - IEA/UNCTAD transit-time estimates for India west coast refineries
 *  - Jamnagar (complex) and MRPL (medium complexity) refinery grade specs
 */

export type GradeCompatibility = "compatible" | "partial" | "incompatible";

export type CrudeAlternative = {
  id: string;
  /** Human-readable name shown in UI */
  name: string;
  /** Geographic origin */
  origin: string;
  /** Grade/type */
  grade: string;
  /**
   * Price differential vs Brent in $/bbl.
   * Negative = discount (cheaper), positive = premium.
   * Used for cost factor: lower is better for India.
   */
  priceDiffBbl: number;
  /**
   * Estimated sea transit days from load port to India west coast
   * (Mundra/Jamnagar reference port).
   */
  transitDays: number;
  /**
   * Tanker availability score: 1–5.
   * 5 = abundant VLCC availability; 1 = very constrained.
   * Illustrative — not live AIS/tanker fixture data.
   */
  availabilityScore: number;
  /**
   * Compatibility with key Indian refinery complexes.
   * "compatible"  = runs as-is at Jamnagar/MRPL.
   * "partial"     = can process with some blending or rate adjustment.
   * "incompatible"= requires major configuration change; operationally
   *                 impractical in short-term disruption scenario.
   */
  gradeCompatibility: GradeCompatibility;
  /** One-line note about the route or grade */
  note: string;
  /**
   * Scenario relevance flags — which disruption IDs this source
   * is most logically relevant for (e.g., Hormuz closure → non-Gulf routes).
   * If empty, considered universally applicable.
   */
  relevantForPresets?: string[];
};

export const CRUDE_ALTERNATIVES: CrudeAlternative[] = [
  {
    id: "west_africa_bonny",
    name: "West Africa — Bonny Light",
    origin: "Nigeria (West Africa)",
    grade: "Bonny Light (sweet, 36°API)",
    priceDiffBbl: +3.0,
    // ~20 days Lagos → Mundra via Cape of Good Hope
    transitDays: 20,
    availabilityScore: 4,
    gradeCompatibility: "compatible",
    note: "Light sweet crude; excellent Jamnagar compatibility. No Gulf routing. Established ONGC equity oil source.",
    relevantForPresets: ["hormuz_full_closure", "hormuz_partial"],
  },
  {
    id: "us_gulf_wti",
    name: "US Gulf Coast — WTI Midland",
    origin: "USA (Gulf Coast)",
    grade: "WTI Midland (light sweet, 40°API)",
    priceDiffBbl: +4.5,
    // ~22–25 days US Gulf → Mundra via Cape or Suez (not affected by Hormuz)
    transitDays: 23,
    availabilityScore: 5,
    gradeCompatibility: "compatible",
    note: "High availability on US export terminals; no political risk. Premium priced vs Brent. Suitable for complex refineries.",
    relevantForPresets: ["hormuz_full_closure", "hormuz_partial", "red_sea_interdiction"],
  },
  {
    id: "russia_urals",
    name: "Russia — Urals (Alternate Tankers)",
    origin: "Russia (Baltic/Black Sea)",
    grade: "Urals (medium sour, 32°API)",
    priceDiffBbl: -6.0,
    // ~18 days Primorsk/Novorossiysk → Mundra via Cape/Suez detour
    transitDays: 18,
    availabilityScore: 3,
    gradeCompatibility: "partial",
    note: "Deeply discounted (Western sanctions). G7 price cap at $60/bbl. Shadow fleet with limited insurance. MRPL-compatible; Jamnagar requires blending.",
    relevantForPresets: ["hormuz_full_closure", "hormuz_partial"],
  },
  {
    id: "brazil_lula",
    name: "Brazil — Lula / Pre-salt",
    origin: "Brazil (Santos Basin)",
    grade: "Lula (medium sweet, 28°API)",
    priceDiffBbl: +2.0,
    // ~25–28 days Santos → Mundra via Cape
    transitDays: 27,
    availabilityScore: 3,
    gradeCompatibility: "partial",
    note: "Growing export volumes; Brazil is India's 5th largest supplier. Slightly waxy; some desalter adjustment needed. Longer transit but fully non-Gulf routing.",
    relevantForPresets: ["hormuz_full_closure", "hormuz_partial"],
  },
  {
    id: "saudi_red_sea",
    name: "Saudi Arabia — Yanbu (Red Sea) Export",
    origin: "Saudi Arabia (Red Sea coast)",
    grade: "Arab Light (medium sour, 34°API)",
    priceDiffBbl: +1.0,
    // ~12–14 days Yanbu → Mundra (bypasses Hormuz, exits via Red Sea/Bab-el-Mandeb)
    transitDays: 13,
    availabilityScore: 4,
    gradeCompatibility: "compatible",
    note: "Saudi can load at Yanbu (Red Sea) rather than Ras Tanura (Gulf), bypassing Hormuz entirely. Same grade, shorter transit than West Africa. Subject to Saudi export capacity constraint.",
    relevantForPresets: ["hormuz_full_closure", "hormuz_partial"],
  },
];
