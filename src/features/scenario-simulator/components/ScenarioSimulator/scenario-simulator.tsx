"use client";

import { useState, useCallback, useRef } from "react";
import {
  FlaskConical,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Ship,
  Shield,
  Gauge,
  Info,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import type {
  PropagationResult,
  RangeEstimate,
  CorridorImpactResult,
} from "@/features/scenario-simulator/types";

// ─── Category colours ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; badge: string }
> = {
  energy: {
    label: "Energy",
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  },
  food_agriculture: {
    label: "Food & Agriculture",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  manufacturing: {
    label: "Manufacturing",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  multi_sector: {
    label: "Multi-Sector",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  },
};

const SEVERITY_COLOR = (pct: number) => {
  if (pct >= 80) return "text-red-400";
  if (pct >= 50) return "text-orange-400";
  if (pct >= 25) return "text-yellow-400";
  return "text-emerald-400";
};

const SSI_COLOR = (score: number) => {
  if (score >= 70) return "text-emerald-400";
  if (score >= 45) return "text-yellow-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
};

const SSI_LABEL = (score: number) => {
  if (score >= 70) return "Secure";
  if (score >= 45) return "At Risk";
  if (score >= 20) return "Stressed";
  return "Critical";
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function RangeBar({
  range,
  maxVal,
  colorClass = "bg-violet-400",
}: {
  range: RangeEstimate;
  maxVal: number;
  colorClass?: string;
}) {
  const minPct = Math.min(100, (range.min / maxVal) * 100);
  const likelyPct = Math.min(100, (range.likely / maxVal) * 100);
  const maxPct = Math.min(100, (range.max / maxVal) * 100);

  return (
    <div className="relative h-2 w-full rounded-full bg-white/5">
      {/* range band */}
      <div
        className="absolute top-0 h-2 rounded-full bg-white/10"
        style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
      />
      {/* likely marker */}
      <div
        className={cn("absolute top-0 h-2 w-1 rounded-full", colorClass)}
        style={{ left: `${likelyPct}%` }}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  range,
  maxVal,
  colorClass,
  note,
}: {
  icon: React.ElementType;
  label: string;
  range: RangeEstimate;
  maxVal: number;
  colorClass?: string;
  note?: string;
}) {
  return (
    <div className="glass-surface rounded-xl border border-white/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {note && (
          <span className="ml-auto text-xs text-muted-foreground/60">{note}</span>
        )}
      </div>
      <div className="mb-1 flex items-end gap-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {range.likely.toFixed(range.likely < 10 ? 1 : 0)}
        </span>
        <span className="mb-0.5 text-xs text-muted-foreground">{range.unit}</span>
      </div>
      <RangeBar range={range} maxVal={maxVal} colorClass={colorClass} />
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground/70">
        <span>{range.min.toFixed(range.min < 10 ? 1 : 0)}</span>
        <span className="text-muted-foreground/40">range</span>
        <span>{range.max.toFixed(range.max < 10 ? 1 : 0)}</span>
      </div>
    </div>
  );
}

function NodeImpactRow({ impact }: { impact: CorridorImpactResult }) {
  const [open, setOpen] = useState(false);
  const isDedup = impact.lockedVolumeMtpa === 0;

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        isDedup
          ? "border-white/5 bg-white/2 opacity-50"
          : "border-white/10 bg-white/5",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={cn(
            "inline-flex h-5 items-center rounded px-1.5 text-xs font-medium",
            impact.nodeType === "corridor"
              ? "bg-violet-500/20 text-violet-300"
              : impact.nodeType === "port"
                ? "bg-blue-500/20 text-blue-300"
                : "bg-orange-500/20 text-orange-300",
          )}
        >
          {impact.nodeType}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">
          {impact.nodeLabel}
        </span>
        {impact.lockedVolumeMtpa !== null && (
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              isDedup ? "text-muted-foreground" : SEVERITY_COLOR(impact.effectiveSeverityPct),
            )}
          >
            {isDedup ? "deduped" : `${impact.lockedVolumeMtpa.toFixed(1)} Mtpa locked`}
          </span>
        )}
        {impact.lagDays !== null && (
          <span className="ml-2 text-xs text-muted-foreground">
            +{impact.lagDays}d lag
          </span>
        )}
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-4 pb-3 pt-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {impact.rationale}
              </p>
              {impact.spareCapacityMtpa !== null && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Spare capacity post-disruption:{" "}
                  <strong className="text-foreground">
                    {impact.spareCapacityMtpa.toFixed(1)} Mtpa
                  </strong>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssumptionsPill({ assumptions }: { assumptions: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <Info className="size-4 shrink-0 text-amber-400" aria-hidden />
        <span className="text-sm font-medium text-amber-300">
          {assumptions.length} Assumptions &amp; Simplifications
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {open ? "hide" : "show"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <ul className="space-y-1.5 border-t border-amber-500/10 px-4 pb-4 pt-3">
              {assumptions.map((a, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-amber-400/60">•</span>
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScenarioSimulator() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    DISRUPTION_PRESETS[0].id,
  );
  const [result, setResult] = useState<PropagationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const selectedPreset = DISRUPTION_PRESETS.find(
    (p) => p.id === selectedPresetId,
  )!;
  const catMeta =
    CATEGORY_META[selectedPreset.category] ?? CATEGORY_META.multi_sector;

  const runSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scenario-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId: selectedPresetId, levers: [] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Unknown error");
      }
      const data: PropagationResult = await res.json();
      setResult(data);
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run simulation");
    } finally {
      setLoading(false);
    }
  }, [selectedPresetId]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/20">
              <FlaskConical className="size-5 text-violet-400" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Scenario Simulator
              </h1>
              <p className="text-xs text-muted-foreground">
                Deterministic capacity-constrained propagation engine ·
                Triangular range estimates
              </p>
            </div>
            {result && (
              <button
                type="button"
                onClick={reset}
                className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

          {/* Left: Scenario selector */}
          <div className="space-y-5">
            <div>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Select Disruption Scenario
              </h2>
              <p className="text-xs text-muted-foreground/60">
                Engine runs deterministically · No LLM in the computation path
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DISRUPTION_PRESETS.map((preset) => {
                const meta =
                  CATEGORY_META[preset.category] ?? CATEGORY_META.multi_sector;
                const isSelected = preset.id === selectedPresetId;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      reset();
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200",
                      isSelected
                        ? "border-white/20 bg-white/[0.06] shadow-xl"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className={cn("mb-2 inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", meta.badge)}>
                          {meta.label}
                        </span>
                        <h3 className="mt-1 text-sm font-semibold text-foreground leading-tight">
                          {preset.label}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {preset.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "text-lg font-normal tabular-nums",
                            SEVERITY_COLOR(preset.severityPct),
                          )}
                        >
                          {preset.severityPct}%
                        </div>
                        <div className="text-xs text-muted-foreground">severity</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        ~{preset.expectedDurationDays}d
                      </span>
                      <span className="flex items-center gap-1">
                        <Ship className="size-3" />
                        {preset.affectedNodeIds.length} nodes
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="size-3" />
                        +{preset.spotFreightPenaltyPct}% freight
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="selected-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Run button */}
            <motion.button
              type="button"
              onClick={runSimulation}
              disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              className={cn(
                "relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4 transition-all hover:bg-white/[0.08]",
                "disabled:cursor-not-allowed disabled:opacity-50 text-foreground",
                "flex items-center justify-center gap-3 text-sm font-semibold uppercase tracking-wider",
              )}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="size-5 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Running propagation engine…
                </>
              ) : (
                <>
                  <Play className="size-5" aria-hidden />
                  Run Scenario Simulation
                </>
              )}
            </motion.button>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertTriangle className="size-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Right: Selected preset details */}
          <div className="space-y-4">
            <div className="glass-surface rounded-xl border border-white/10 p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selected Scenario
              </div>
              <h2 className="text-base font-bold text-foreground">
                {selectedPreset.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {selectedPreset.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <div className="text-xs text-muted-foreground">Severity (likely)</div>
                  <div className={cn("text-xl font-bold", SEVERITY_COLOR(selectedPreset.severityPct))}>
                    {selectedPreset.severityPct}%
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    range {selectedPreset.severityRange.min}–{selectedPreset.severityRange.max}%
                  </div>
                </div>
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <div className="text-xs text-muted-foreground">Duration (likely)</div>
                  <div className="text-xl font-bold text-foreground">
                    {selectedPreset.expectedDurationDays}d
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    range {selectedPreset.durationRange.min}–{selectedPreset.durationRange.max}d
                  </div>
                </div>
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <div className="text-xs text-muted-foreground">Freight Penalty</div>
                  <div className="text-xl font-bold text-orange-400">
                    +{selectedPreset.spotFreightPenaltyPct}%
                  </div>
                  <div className="text-xs text-muted-foreground/60">spot charter rate</div>
                </div>
                <div className="rounded-lg bg-black/20 px-3 py-2">
                  <div className="text-xs text-muted-foreground">Ins. Peak</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {selectedPreset.insurancePremiumPeakBps}bps
                  </div>
                  <div className="text-xs text-muted-foreground/60">war-risk premium</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1.5 text-xs text-muted-foreground">Affected nodes</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPreset.affectedNodeIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-black/30 px-2 py-0.5 text-xs font-mono text-foreground/70"
                    >
                      {id.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Methodology note */}
            <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Zap className="size-3.5 text-violet-400" aria-hidden />
                <span className="text-xs font-semibold text-violet-300">Engine Design</span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• BFS propagation through India trade graph</li>
                <li>• Capacity-constrained per node (20 annotated nodes)</li>
                <li>• Transit vs. production node branching</li>
                <li>• Route-family deduplication (no double-counting)</li>
                <li>• Port-corridor flow fraction scaling</li>
                <li>• Triangular min/likely/max for all outputs</li>
                <li>• SSI weights: 35/25/30/10 (gap/ETA/reserve/freight)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Results ───────────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-10 space-y-6"
            >
              {/* Results header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Activity className="size-5 text-violet-400" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Simulation Results
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Computed at{" "}
                      {new Date(result.computedAt).toLocaleTimeString()} ·{" "}
                      {result.nodeImpacts.length} nodes processed ·{" "}
                      {result.metrics.assumptions.length} assumptions logged
                    </p>
                  </div>
                </div>
                {/* SSI score badge */}
                <div className="text-right">
                  <div
                    className={cn(
                      "text-3xl font-black tabular-nums",
                      SSI_COLOR(result.metrics.supplySecurityIndex),
                    )}
                  >
                    {result.metrics.supplySecurityIndex}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SSI · {SSI_LABEL(result.metrics.supplySecurityIndex)}
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                <MetricCard
                  icon={TrendingDown}
                  label="Supply Gap"
                  range={result.metrics.supplyGapMtpa}
                  maxVal={300}
                  colorClass="bg-red-400"
                />
                <MetricCard
                  icon={Clock}
                  label="ETA Shift"
                  range={result.metrics.etaShiftDays}
                  maxVal={90}
                  colorClass="bg-orange-400"
                />
                <MetricCard
                  icon={Ship}
                  label="Freight Index"
                  range={result.metrics.freightRateIndex}
                  maxVal={400}
                  colorClass="bg-yellow-400"
                  note="100 = baseline"
                />
                <MetricCard
                  icon={Shield}
                  label="Insurance"
                  range={result.metrics.insurancePremiumBps}
                  maxVal={500}
                  colorClass="bg-blue-400"
                  note="bps"
                />
                <MetricCard
                  icon={BarChart3}
                  label="Landed Cost Δ"
                  range={result.metrics.landedCostDeltaPerUnit}
                  maxVal={30}
                  colorClass="bg-violet-400"
                />
                <div className="glass-surface rounded-xl border border-white/10 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Gauge className="size-4 text-muted-foreground" aria-hidden />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      SSI Score
                    </span>
                  </div>
                  <div
                    className={cn(
                      "text-4xl font-black tabular-nums",
                      SSI_COLOR(result.metrics.supplySecurityIndex),
                    )}
                  >
                    {result.metrics.supplySecurityIndex}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-sm font-semibold",
                      SSI_COLOR(result.metrics.supplySecurityIndex),
                    )}
                  >
                    {SSI_LABEL(result.metrics.supplySecurityIndex)}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground/60">
                    weights 35/25/30/10
                  </div>
                </div>
              </div>

              {/* Node impacts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Node Impact Breakdown
                  </h3>
                  <span className="ml-auto text-xs text-muted-foreground/60">
                    click to expand rationale
                  </span>
                </div>
                <div className="space-y-2">
                  {result.nodeImpacts.map((impact) => (
                    <NodeImpactRow key={impact.nodeId} impact={impact} />
                  ))}
                </div>
              </div>

              {/* Assumptions */}
              <AssumptionsPill assumptions={result.metrics.assumptions} />

              {/* SSI weights breakdown */}
              <div className="glass-surface rounded-xl border border-white/10 p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  SSI Weight Decomposition
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    {
                      label: "Supply Gap",
                      weight: result.metrics.ssiWeightsUsed.supplyGapVolume,
                      val: result.metrics.supplyGapMtpa.likely,
                      unit: "Mtpa",
                    },
                    {
                      label: "ETA Shift",
                      weight: result.metrics.ssiWeightsUsed.etaShift,
                      val: result.metrics.etaShiftDays.likely,
                      unit: "days",
                    },
                    {
                      label: "Reserve Trajectory",
                      weight: result.metrics.ssiWeightsUsed.reserveTrajectory,
                      val: result.metrics.reserveDepletionDaysToFloor ?? 0,
                      unit: "d to floor",
                    },
                    {
                      label: "Freight + Insurance",
                      weight: result.metrics.ssiWeightsUsed.freightAndInsuranceCost,
                      val: result.metrics.freightRateIndex.likely,
                      unit: "index",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="glass-surface rounded-lg border border-white/10 p-4"
                    >
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </div>
                      <div className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                        {Math.round(item.weight * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">weight</div>
                      <div className="mt-3 text-sm font-semibold tabular-nums text-foreground">
                        {item.val.toFixed(1)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
