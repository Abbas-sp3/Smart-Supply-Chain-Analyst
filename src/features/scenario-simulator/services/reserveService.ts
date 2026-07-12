/**
 * Reserve Drawdown Service
 *
 * Governs how the propagation engine models India's Strategic Petroleum Reserve
 * (SPR) drawdown under a disruption + lever combination.
 *
 * Hard rules (never softened):
 *   1. effectiveDailyRateMtpa <= maxDailyDrawdownMtpa  (injection rate ceiling)
 *   2. Reserve never simulated below minReserveFloorDays  (policy floor)
 */

import type { DecisionLever, StrategicReserveReleaseLever } from "../types";
import {
  INDIA_RESERVE_CONFIG,
  computeReserveDepletionDays,
  type ReserveConfig,
} from "../constants/reserve-config";

export type ReserveDrawdownResult = {
  /** Whether a strategic_reserve_release lever is active. */
  isActive: boolean;
  /** Requested daily drawdown rate from the lever (Mtpa/day). */
  requestedDailyRateMtpa: number;
  /**
   * Effective daily rate after:
   *  - Rate ceiling enforcement (maxDailyDrawdownMtpa)
   *  - Floor check (will hit minReserveFloorDays before lever expires)
   */
  effectiveDailyRateMtpa: number;
  /**
   * Annualised effective relief rate (Mtpa/yr).
   * Used by metricsService to offset the supply gap.
   */
  annualisedReliefMtpa: number;
  /** Days until reserve hits minReserveFloorDays. Null if reserve not being drawn. */
  daysToFloor: number | null;
  /** Total deployable reserve volume above floor (Mtpa). */
  deployableVolumeMtpa: number;
  /** True if requested rate was capped by the injection rate ceiling. */
  cappedByRateLimit: boolean;
  /** True if reserve would hit the policy floor before lever duration expires. */
  cappedByFloor: boolean;
};

export function computeReserveDrawdown(
  levers: DecisionLever[],
  config: ReserveConfig = INDIA_RESERVE_CONFIG,
): ReserveDrawdownResult {
  const releaseLever = levers.find(
    (l): l is StrategicReserveReleaseLever =>
      l.type === "strategic_reserve_release",
  );

  const ZERO: ReserveDrawdownResult = {
    isActive: false,
    requestedDailyRateMtpa: 0,
    effectiveDailyRateMtpa: 0,
    annualisedReliefMtpa: 0,
    daysToFloor: null,
    deployableVolumeMtpa: 0,
    cappedByRateLimit: false,
    cappedByFloor: false,
  };

  if (!releaseLever) return ZERO;

  const dailyConsumption = config.normalConsumptionMtpa / 365;
  const currentVol = config.totalReserveDays * dailyConsumption;
  const floorVol = config.minReserveFloorDays * dailyConsumption;
  const deployableVol = Math.max(0, currentVol - floorVol);

  const requested = releaseLever.dailyRateMtpa;
  const cappedByRateLimit = requested > config.maxDailyDrawdownMtpa;
  const rateLimited = Math.min(requested, config.maxDailyDrawdownMtpa);

  // Check if floor would be hit before lever duration ends
  const daysUntilFloor = deployableVol / rateLimited;
  const cappedByFloor = daysUntilFloor < releaseLever.durationDays;

  // If floor would be hit in less than 1 day, no meaningful drawdown is possible
  const effective = deployableVol < rateLimited ? deployableVol : rateLimited;

  const daysToFloor = computeReserveDepletionDays(
    config.totalReserveDays,
    effective,
    config,
  );

  return {
    isActive: true,
    requestedDailyRateMtpa: requested,
    effectiveDailyRateMtpa: effective,
    annualisedReliefMtpa: effective * 365,
    daysToFloor,
    deployableVolumeMtpa: deployableVol,
    cappedByRateLimit,
    cappedByFloor,
  };
}
