/**
 * scoringEngine.ts — Weighted composite scoring for crude procurement alternatives
 *
 * Scoring weights (explicit, commentable in demo):
 *   Cost factor        40% — lower price diff = better score
 *   Transit time       30% — fewer days in transit = better score
 *   Availability       20% — higher tanker availability = better score
 *   Grade compat.      10% — compatible > partial > incompatible
 *
 * Each factor is normalized to [0, 1] within the set of alternatives
 * so that no single outlier distorts the ranking.
 */

import type { CrudeAlternative } from "../data/alternativeSources";
import { CRUDE_ALTERNATIVES } from "../data/alternativeSources";

export type ScoredAlternative = CrudeAlternative & {
  /** Final weighted composite score, 0–100 */
  compositeScore: number;
  /** Individual normalized factor scores, 0–1 */
  factors: {
    cost: number;
    transit: number;
    availability: number;
    gradeCompat: number;
  };
  /** Rank position (1 = best) */
  rank: number;
};

// ── Weights ──────────────────────────────────────────────────────────────────
const WEIGHT_COST = 0.40;         // 40% — price is the dominant lever under crisis
const WEIGHT_TRANSIT = 0.30;      // 30% — speed matters when reserves are ticking down
const WEIGHT_AVAILABILITY = 0.20; // 20% — can you actually get a tanker on short notice?
const WEIGHT_GRADE_COMPAT = 0.10; // 10% — refinery feed flexibility is constrained but partial sources still viable

// ── Grade compat → numeric ───────────────────────────────────────────────────
function gradeCompatToScore(compat: CrudeAlternative["gradeCompatibility"]): number {
  if (compat === "compatible") return 1.0;
  if (compat === "partial")    return 0.5;
  return 0.0; // incompatible
}

// ── Min-max normalizer ────────────────────────────────────────────────────────
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 1; // all identical → treat as perfect
  return (value - min) / (max - min);
}

/**
 * Score and rank alternatives for the given disruption preset.
 *
 * If a presetId is provided:
 *   - Sources with relevantForPresets that include the presetId are shown first.
 *   - Sources with no relevantForPresets filter are also included (universally applicable).
 *   - Sources with relevantForPresets set that does NOT include the presetId are excluded.
 */
export function rankAlternatives(presetId?: string): ScoredAlternative[] {
  // Filter by preset relevance
  const candidates = CRUDE_ALTERNATIVES.filter((alt) => {
    if (!alt.relevantForPresets || alt.relevantForPresets.length === 0) return true;
    if (!presetId) return true;
    return alt.relevantForPresets.includes(presetId);
  });

  if (candidates.length === 0) return [];

  // ── Raw data ranges (for normalization) ──────────────────────────────────
  const priceDiffs = candidates.map((a) => a.priceDiffBbl);
  const transits   = candidates.map((a) => a.transitDays);
  const avails     = candidates.map((a) => a.availabilityScore);

  const minPrice  = Math.min(...priceDiffs);
  const maxPrice  = Math.max(...priceDiffs);
  const minTransit = Math.min(...transits);
  const maxTransit = Math.max(...transits);
  const minAvail  = Math.min(...avails);
  const maxAvail  = Math.max(...avails);

  const scored: ScoredAlternative[] = candidates.map((alt) => {
    // Cost: lower priceDiff = better. Invert normalization.
    const costRaw  = normalize(alt.priceDiffBbl, minPrice, maxPrice);
    const costScore = 1 - costRaw; // flip: cheapest gets 1.0

    // Transit: fewer days = better. Invert.
    const transitRaw  = normalize(alt.transitDays, minTransit, maxTransit);
    const transitScore = 1 - transitRaw;

    // Availability: higher = better. Direct normalization.
    const availScore = normalize(alt.availabilityScore, minAvail, maxAvail);

    // Grade compat: fixed categorical mapping.
    const gradeScore = gradeCompatToScore(alt.gradeCompatibility);

    // Weighted composite — multiply by 100 for readability
    const composite =
      (costScore        * WEIGHT_COST         +
       transitScore     * WEIGHT_TRANSIT       +
       availScore       * WEIGHT_AVAILABILITY  +
       gradeScore       * WEIGHT_GRADE_COMPAT) * 100;

    return {
      ...alt,
      compositeScore: Math.round(composite * 10) / 10, // 1 decimal
      factors: {
        cost:        Math.round(costScore * 100) / 100,
        transit:     Math.round(transitScore * 100) / 100,
        availability: Math.round(availScore * 100) / 100,
        gradeCompat: Math.round(gradeScore * 100) / 100,
      },
      rank: 0, // set after sort
    };
  });

  // Sort descending by composite score
  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  // Assign ranks
  scored.forEach((a, i) => { a.rank = i + 1; });

  return scored;
}

// ── Weight metadata for display ───────────────────────────────────────────────
export const SCORING_WEIGHTS = [
  { factor: "Cost (price diff vs Brent)", weight: WEIGHT_COST,          pct: "40%" },
  { factor: "Transit time to India west coast", weight: WEIGHT_TRANSIT, pct: "30%" },
  { factor: "Tanker availability",  weight: WEIGHT_AVAILABILITY,        pct: "20%" },
  { factor: "Grade compatibility",  weight: WEIGHT_GRADE_COMPAT,        pct: "10%" },
];
