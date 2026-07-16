"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PropagationResult, StrategicReserveReleaseLever } from "@/features/scenario-simulator/types";
import { INDIA_RESERVE_CONFIG } from "@/features/scenario-simulator/constants/reserve-config";
import { MetricRangeChart } from "./metrics-range-chart";
import { ReserveDepletionChart } from "./reserve-depletion-chart";

type MetricDeltaRowProps = {
  label: string;
  baselineVal: number;
  leverVal: number;
  unit: string;
  lowerIsBetter: boolean;
  children?: React.ReactNode;
  unchangedReason?: string;
};

function MetricDeltaRow({
  label,
  baselineVal,
  leverVal,
  unit,
  lowerIsBetter,
  children,
  unchangedReason,
}: MetricDeltaRowProps) {
  const delta = leverVal - baselineVal;
  const pctChange = baselineVal !== 0 ? (delta / Math.abs(baselineVal)) * 100 : 0;
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const unchanged = Math.abs(delta) < 0.01;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="tabular-nums text-sm text-muted-foreground">
        {baselineVal.toFixed(1)}
        <span className="ml-1 text-xs text-muted-foreground/50">{unit}</span>
      </span>
      <span className="tabular-nums text-sm font-semibold text-foreground">
        {leverVal.toFixed(1)}
        <span className="ml-1 text-xs font-normal text-muted-foreground/50">{unit}</span>
      </span>
      <div className="flex flex-col items-end">
        <span
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
            unchanged
              ? "bg-white/5 text-muted-foreground"
              : improved
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400",
          )}
        >
          {unchanged ? (
            <Minus className="size-3" />
          ) : improved ? (
            <TrendingDown className="size-3" />
          ) : (
            <TrendingUp className="size-3" />
          )}
          {unchanged
            ? "—"
            : `${delta > 0 ? "+" : ""}${pctChange.toFixed(0)}%`}
        </span>
        {unchanged && unchangedReason && (
          <span className="text-[10px] text-muted-foreground/40 mt-1 max-w-[120px] text-right leading-tight">
            {unchangedReason}
          </span>
        )}
      </div>
      {children && <div className="col-span-4 mt-2">{children}</div>}
    </div>
  );
}

type MetricsComparisonProps = {
  baseline: PropagationResult;
  withLevers: PropagationResult;
};

export function MetricsComparison({ baseline, withLevers }: MetricsComparisonProps) {
  const ssiDelta = withLevers.metrics.supplySecurityIndex - baseline.metrics.supplySecurityIndex;
  const ssiImproved = ssiDelta > 0;

  const sprLever = withLevers.appliedLevers.find(
    (l): l is StrategicReserveReleaseLever => l.type === "strategic_reserve_release",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-surface rounded-xl border border-white/10 p-5"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Impact of Decision Levers
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Baseline → with levers applied
          </p>
        </div>

        {/* SSI delta badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Baseline SSI</div>
            <div className="text-xl font-bold tabular-nums text-foreground">
              {baseline.metrics.supplySecurityIndex}
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums",
              ssiImproved
                ? "bg-emerald-500/10 text-emerald-400"
                : Math.abs(ssiDelta) < 1
                  ? "bg-white/5 text-muted-foreground"
                  : "bg-red-500/10 text-red-400",
            )}
          >
            {ssiImproved ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
            {ssiDelta > 0 ? "+" : ""}{ssiDelta.toFixed(0)} SSI
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">With levers</div>
            <div
              className={cn(
                "text-xl font-bold tabular-nums",
                ssiImproved ? "text-emerald-400" : "text-red-400",
              )}
            >
              {withLevers.metrics.supplySecurityIndex}
            </div>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
        <span>Metric</span>
        <span>Baseline</span>
        <span>With levers</span>
        <span>Δ Change</span>
      </div>

      {/* Rows */}
      <MetricDeltaRow
        label="Supply Gap"
        baselineVal={baseline.metrics.supplyGapMtpa.likely}
        leverVal={withLevers.metrics.supplyGapMtpa.likely}
        unit="Mtpa"
        lowerIsBetter={true}
      >
        <MetricRangeChart
          baseline={baseline.metrics.supplyGapMtpa}
          lever={withLevers.metrics.supplyGapMtpa}
          unit="Mtpa"
          lowerIsBetter={true}
        />
      </MetricDeltaRow>
      <MetricDeltaRow
        label="ETA Shift"
        baselineVal={baseline.metrics.etaShiftDays.likely}
        leverVal={withLevers.metrics.etaShiftDays.likely}
        unit="days"
        lowerIsBetter={true}
      >
        <MetricRangeChart
          baseline={baseline.metrics.etaShiftDays}
          lever={withLevers.metrics.etaShiftDays}
          unit="days"
          lowerIsBetter={true}
        />
      </MetricDeltaRow>
      <MetricDeltaRow
        label="Freight Index"
        baselineVal={baseline.metrics.freightRateIndex.likely}
        leverVal={withLevers.metrics.freightRateIndex.likely}
        unit="idx"
        lowerIsBetter={true}
        unchangedReason="Unaffected by applied levers"
      />
      <MetricDeltaRow
        label="Insurance"
        baselineVal={baseline.metrics.insurancePremiumBps.likely}
        leverVal={withLevers.metrics.insurancePremiumBps.likely}
        unit="bps"
        lowerIsBetter={true}
        unchangedReason="Unaffected by applied levers"
      />
      <MetricDeltaRow
        label="Landed Cost Δ"
        baselineVal={baseline.metrics.landedCostDeltaPerUnit.likely}
        leverVal={withLevers.metrics.landedCostDeltaPerUnit.likely}
        unit="%"
        lowerIsBetter={true}
        unchangedReason="Unaffected by applied levers"
      />

      {/* Reserve release detail — only when SPR lever was used */}
      {withLevers.metrics.reserveClipInfo && (
        <div
          className={cn(
            "mt-3 rounded-lg border px-3 py-2.5 text-xs",
            withLevers.metrics.reserveClipInfo.clippedByFloor ||
            withLevers.metrics.reserveClipInfo.clippedByRateLimit
              ? "border-amber-500/20 bg-amber-500/5 text-amber-300/80"
              : "border-white/8 bg-white/[0.02] text-muted-foreground",
          )}
        >
          {withLevers.metrics.reserveClipInfo.clippedByFloor ? (
            <>
              <span className="font-medium text-amber-300">SPR duration clipped by policy floor</span>
              {" — requested "}
              <strong className="text-foreground">{withLevers.metrics.reserveClipInfo.requestedDays}d</strong>
              {", sustained "}
              <strong className="text-foreground">{withLevers.metrics.reserveClipInfo.sustainedDays}d</strong>
              {" before the "}
              {withLevers.metrics.reserveDepletionDaysToFloor !== null && (
                <>{withLevers.metrics.reserveDepletionDaysToFloor.toFixed(1)}d {" "}</>
              )}
              {"20-day cover floor was reached"}
            </>
          ) : withLevers.metrics.reserveClipInfo.clippedByRateLimit ? (
            <>
              <span className="font-medium text-amber-300">SPR rate capped at injection ceiling</span>
              {" — requested duration of "}
              <strong className="text-foreground">{withLevers.metrics.reserveClipInfo.requestedDays}d</strong>
              {" at max SPR rate. Reserve floor not reached."}
            </>
          ) : (
            <>
              SPR release: <strong className="text-foreground">{withLevers.metrics.reserveClipInfo.requestedDays}d</strong>
              {" at requested rate — no clipping applied"}
            </>
          )}

          {sprLever && (
            <ReserveDepletionChart
              startingDays={INDIA_RESERVE_CONFIG.totalReserveDays}
              dailyDrawdownMtpa={Math.min(sprLever.dailyRateMtpa, INDIA_RESERVE_CONFIG.maxDailyDrawdownMtpa)}
              durationDays={withLevers.metrics.reserveClipInfo.requestedDays}
              clippedByFloor={withLevers.metrics.reserveClipInfo.clippedByFloor}
              sustainedDays={withLevers.metrics.reserveClipInfo.sustainedDays}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}
