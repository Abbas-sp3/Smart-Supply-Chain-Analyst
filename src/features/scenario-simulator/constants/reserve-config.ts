/**
 * Strategic Reserve Configuration
 *
 * Governs how the propagation engine models India's Strategic Petroleum
 * Reserve (SPR) drawdown under a disruption scenario.
 *
 * Data sources:
 *   - MoPNG Strategic Petroleum Reserve programme documentation
 *   - IEA India Energy Policy Review 2020
 *   - PPAC (Petroleum Planning & Analysis Cell) monthly inventory reports
 *   - IEA Emergency Response System (ERS) guidelines
 *
 * CRITICAL CONSTRAINT (Phase 1 requirement A.C):
 *   Reserves NEVER simulate depleting to zero.
 *   The engine enforces minReserveFloorDays at all times.
 *   Any lever that would breach the floor is capped automatically.
 */

import type { SsiWeights } from "../types";

// ---------------------------------------------------------------------------
// Real-world Infrastructure Data (Physical limits, not arbitrary numbers)
// ---------------------------------------------------------------------------

/**
 * ISPRL Phase I Operational Facilities
 * Source: Indian Strategic Petroleum Reserves Limited (ISPRL) official project data.
 * Capacity is fixed physical infrastructure limits in Million Metric Tonnes (MMT).
 */
export const ISPRL_PHASE_1_FACILITIES = [
  { id: "padur", name: "Padur", capacityMmt: 2.5, state: "Karnataka", fillPct: 77.2 },
  { id: "mangaluru", name: "Mangaluru", capacityMmt: 1.5, state: "Karnataka", fillPct: 77.3 },
  { id: "vizag", name: "Visakhapatnam", capacityMmt: 1.33, state: "Andhra Pradesh", fillPct: 76.7 },
];

/**
 * Total Phase 1 Capacity = 5.33 MMT
 */
export const ISPRL_TOTAL_CAPACITY_MMT = ISPRL_PHASE_1_FACILITIES.reduce((acc, f) => acc + f.capacityMmt, 0);

/**
 * Current State Estimate (for baseline simulation)
 * Exact daily fill rates are classified; 77% is the PPAC / media consensus estimate 
 * for mid-2026 baseline.
 */
export const ISPRL_CURRENT_STATE = {
  nationalFillPercent: 77,
  currentFillMmt: 4.094, // 5.33 * 0.77
  currentCoverDays: 64, // ISPRL + Commercial OMC stocks combined (PPAC estimate)
  ieaNormDays: 90, // International Energy Agency mandatory minimum
};

// ---------------------------------------------------------------------------
// Reserve Parameters
// ---------------------------------------------------------------------------

export type ReserveConfig = {
  /**
   * India's total commercial + strategic crude reserves at normal operating
   * levels. Includes:
   *   - Strategic Petroleum Reserve (SPR): Padur, Visakhapatnam, Mangaluru
   *   - Mandatory commercial inventory held by oil companies
   * Unit: Mtpa-equivalent days at current consumption rate.
   */
  totalReserveDays: number;

  /**
   * Policy floor: engine MUST NOT simulate reserves dropping below this level.
   * Equivalent to IEA's 90-day import cover norm (India currently holds ~64 days).
   * The floor prevents the simulation from producing politically/operationally
   * implausible "reserves hit zero" outcomes.
   */
  minReserveFloorDays: number;

  /**
   * Maximum daily drawdown rate from the SPR facility.
   * Constrained by pipeline injection capacity and terminal logistics.
   * Source: MoPNG SPR programme; Padur + Vizag combined injection rate.
   */
  maxDailyDrawdownMtpa: number;

  /**
   * The SPR volume (Mtpa-equivalent, annualised) that can be deployed
   * in a single crisis event before replenishment is required.
   * Derived from declared SPR capacity at three sites.
   */
  singleEventDrawdownCapacityMtpa: number;

  /**
   * Minimum number of days before drawn reserves can be meaningfully
   * replenished (logistical and contractual lead time).
   */
  replenishmentLeadTimeDays: number;

  /**
   * Normal crude oil consumption rate for India (Mtpa).
   * Used to convert reserve volume into days-of-cover.
   * Source: PPAC 2023-24.
   */
  normalConsumptionMtpa: number;
};

/**
 * Live configuration values.
 * Update these when PPAC publishes revised inventory data.
 */
export const INDIA_RESERVE_CONFIG: ReserveConfig = {
  // India's total crude oil reserves at normal operating levels:
  //   SPR (Padur 2.5 MMT + Vizag 1.33 MMT + Mangaluru 1.5 MMT = 5.33 MMT)
  //   + commercial stocks typically held by IOC, BPCL, HPCL (~45 days cover)
  //   Combined ~64 days of import cover (IEA India review 2020; PPAC Q3 2023)
  totalReserveDays: 64,

  // POLICY FLOOR: never simulate below 20 days.
  // Rationale: below 20 days, India would declare a national energy emergency;
  // that is outside the scope of this simulation model.
  minReserveFloorDays: 20,

  // SPR injection capacity: ~50,000 bbl/day combined across Padur + Vizag.
  // Converted: 50,000 bbl/day × 365 × 0.136 MT/bbl ≈ 2.49 Mtpa
  maxDailyDrawdownMtpa: 0.0068, // ~50,000 bbl/day in Mtpa/day terms (0.0068 = 2.49/365)

  // Total SPR declared capacity (GoI announced 5.33 MMT = 5.33 Mtpa-equivalent)
  singleEventDrawdownCapacityMtpa: 5.33,

  // Lead time for meaningful replenishment from spot market to SPR injection
  replenishmentLeadTimeDays: 45,

  // India crude oil consumption: ~5.2 Mbbl/day × 365 × 0.136 = ~258 Mtpa
  // Source: PPAC Annual Report 2023-24
  normalConsumptionMtpa: 258,
};

// ---------------------------------------------------------------------------
// SSI Weight Presets (named configs — swappable per persona)
// ---------------------------------------------------------------------------

/**
 * Government of India / national security analyst view.
 * Approved weights (Phase 1 decision):
 *   supplyGapVolume:     0.35
 *   etaShift:            0.25
 *   reserveTrajectory:   0.30  (elevated: thin reserve buffer vs. IEA norms)
 *   freightAndInsurance: 0.10
 */
export const SSI_WEIGHTS_GOI: SsiWeights = {
  supplyGapVolume: 0.35,
  etaShift: 0.25,
  reserveTrajectory: 0.30,
  freightAndInsuranceCost: 0.10,
};

/**
 * Private refiner / commercial operator view.
 * Refiners care more about landed cost and ETA (cash flow, plant scheduling)
 * and less about reserve trajectory (that is a GoI concern).
 */
export const SSI_WEIGHTS_PRIVATE_REFINER: SsiWeights = {
  supplyGapVolume: 0.30,
  etaShift: 0.30,
  reserveTrajectory: 0.15,
  freightAndInsuranceCost: 0.25,
};

/** Default weights used when no persona is specified. */
export const DEFAULT_SSI_WEIGHTS = SSI_WEIGHTS_GOI;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute days-of-cover remaining given a drawdown scenario.
 *
 * @param currentReserveDays - Current reserve cover in days
 * @param dailyDrawdownMtpa  - Drawdown rate in Mtpa/day
 * @param consumptionMtpa    - Normal daily consumption in Mtpa/day
 * @returns Days until reserve hits minReserveFloorDays, or null if not drawing
 */
export function computeReserveDepletionDays(
  currentReserveDays: number,
  dailyDrawdownMtpa: number,
  config: ReserveConfig = INDIA_RESERVE_CONFIG,
): number | null {
  if (dailyDrawdownMtpa <= 0) return null;

  const dailyConsumptionMtpa = config.normalConsumptionMtpa / 365;
  const currentVolumeMtpa = currentReserveDays * dailyConsumptionMtpa;
  const floorVolumeMtpa = config.minReserveFloorDays * dailyConsumptionMtpa;
  const deployableVolumeMtpa = Math.max(0, currentVolumeMtpa - floorVolumeMtpa);

  // Enforce rate ceiling
  const effectiveDrawdown = Math.min(dailyDrawdownMtpa, config.maxDailyDrawdownMtpa);
  if (effectiveDrawdown <= 0) return null;

  return deployableVolumeMtpa / effectiveDrawdown;
}

/**
 * Compute the insurance premium for a given day within an event,
 * using the linear_ramp_plateau_decay model.
 *
 * Profile:
 *   - Days 0 → 20% of duration: linear ramp from 0 to peakBps
 *   - Days 20% → 80% of duration: flat at peakBps
 *   - Days 80% → 100% of duration: linear decay from peakBps to 0
 *
 * @param dayInEvent   - Current day within the event (0-indexed)
 * @param durationDays - Total expected event duration
 * @param peakBps      - Peak insurance premium in basis points
 * @param model        - Decay model from the preset
 * @returns Insurance premium in basis points for this day
 */
export function computeInsurancePremiumBps(
  dayInEvent: number,
  durationDays: number,
  peakBps: number,
  model: "linear_ramp_plateau_decay" | "flat" | "custom",
): number {
  if (model === "flat" || model === "custom") return peakBps;

  // linear_ramp_plateau_decay
  const rampEnd = durationDays * 0.20;
  const decayStart = durationDays * 0.80;

  if (dayInEvent <= 0) return 0;
  if (dayInEvent <= rampEnd) {
    // Ramp up phase
    return (dayInEvent / rampEnd) * peakBps;
  }
  if (dayInEvent <= decayStart) {
    // Plateau
    return peakBps;
  }
  if (dayInEvent <= durationDays) {
    // Decay phase
    const decayDuration = durationDays - decayStart;
    const dayIntoDecay = dayInEvent - decayStart;
    return peakBps * (1 - dayIntoDecay / decayDuration);
  }
  // After event ends
  return 0;
}
