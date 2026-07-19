"use client";

import { useState, useRef } from "react";
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
  Leaf,
  Factory,
  Hexagon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { CATEGORY_META, SEVERITY_COLOR } from "@/features/scenario-simulator/constants/ui-constants";
import { useSimulation } from "@/features/scenario-simulator/hooks/useSimulation";
import {
  DecisionLevers,
  DEFAULT_LEVER_STATE,
  buildLeversArray,
  type LeverState,
} from "@/features/scenario-simulator/components/DecisionLevers/decision-levers";
import { DisruptionPresetSelector } from "@/features/scenario-simulator/components/DisruptionPresetSelector/disruption-preset-selector";
import { MetricsComparison } from "@/features/scenario-simulator/components/MetricsComparison/metrics-comparison";
import { NodeTrajectoryCard } from "@/features/scenario-simulator/components/NodeTrajectoryCard";

import { ScenarioMap } from "@/features/scenario-simulator/components/ScenarioMap/scenario-map";
import type {
  PropagationResult,
  RangeEstimate,
  CorridorImpactResult,
} from "@/features/scenario-simulator/types";



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

// ─── Sub-components ───────────────────────────────────────────────────────────

function RangeBar({
  range,
  maxVal,
  colorClass = "bg-primary/70",
}: {
  range: RangeEstimate;
  maxVal: number;
  colorClass?: string;
}) {
  const minPct = Math.min(100, (range.min / maxVal) * 100);
  const likelyPct = Math.min(100, (range.likely / maxVal) * 100);
  const maxPct = Math.min(100, (range.max / maxVal) * 100);

  return (
    <div className="relative h-1.5 w-full rounded-full bg-white/5">
      <div
        className="absolute top-0 h-1.5 rounded-full bg-white/10"
        style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
      />
      <div
        className={cn("absolute top-0 h-1.5 w-1 rounded-full", colorClass)}
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
    <div className="solid-card card-hover rounded-xl border border-white/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {note && (
          <span className="ml-auto text-xs text-muted-foreground/60">{note}</span>
        )}
      </div>
      <div className="mb-1 flex items-end gap-2">
        <span className="text-2xl font-black tabular-nums text-foreground">
          {range.likely.toFixed(range.likely < 10 ? 1 : 0)}
        </span>
        <span className="mb-0.5 text-xs text-muted-foreground">{range.unit}</span>
      </div>
      <RangeBar range={range} maxVal={maxVal} colorClass={colorClass} />
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground/60">
        <span>{range.min.toFixed(range.min < 10 ? 1 : 0)}</span>
        <span className="text-muted-foreground/30">range</span>
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
        "rounded-xl border transition-all duration-200",
        isDedup
          ? "border-white/5 bg-[#0c1018] opacity-50"
          : "border-white/10 bg-[#0e1319] card-hover",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={cn(
            "inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wide",
            impact.nodeType === "corridor"
              ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
              : impact.nodeType === "port"
                ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                : "border-orange-500/30 bg-orange-500/10 text-orange-400",
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
              "text-sm tabular-nums",
              isDedup
                ? "text-muted-foreground"
                : SEVERITY_COLOR(impact.effectiveSeverityPct),
            )}
          >
            {isDedup ? "deduplicated" : `${impact.lockedVolumeMtpa.toFixed(1)} Mtpa locked`}
          </span>
        )}
        {impact.lagDays !== null && !isDedup && (
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
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-4 pb-3 pt-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {impact.rationale}
              </p>
              {impact.spareCapacityMtpa !== null && (
                <p className="mt-1 text-xs text-muted-foreground/60">
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
    <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04]">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <Info className="size-4 shrink-0 text-amber-400/70" aria-hidden />
        <span className="text-sm font-medium text-amber-300/80">
          {assumptions.length} Assumptions &amp; Caveats
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
            <ul className="space-y-2 border-t border-amber-500/10 px-4 pb-4 pt-3">
              {assumptions.map((a, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-amber-400/40">•</span>
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

// ─── Results section (shared for baseline + lever runs) ───────────────────────

function ResultsSection({ result }: { result: PropagationResult }) {
  return (
    <div className="space-y-6">
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={TrendingDown}
          label="Supply Gap"
          range={result.metrics.supplyGapMtpa}
          maxVal={300}
          colorClass="bg-rose-500/80"
        />
        <MetricCard
          icon={Clock}
          label="ETA Shift"
          range={result.metrics.etaShiftDays}
          maxVal={90}
          colorClass="bg-amber-500/80"
        />
        <MetricCard
          icon={Ship}
          label="Freight Index"
          range={result.metrics.freightRateIndex}
          maxVal={400}
          colorClass="bg-fuchsia-500/80"
          note="100 = baseline"
        />
        <MetricCard
          icon={Shield}
          label="Insurance"
          range={result.metrics.insurancePremiumBps}
          maxVal={500}
          colorClass="bg-blue-500/80"
          note="bps"
        />
        <MetricCard
          icon={BarChart3}
          label="Landed Cost Δ"
          range={result.metrics.landedCostDeltaPerUnit}
          maxVal={30}
          colorClass="bg-indigo-500/80"
        />
        <div className="solid-card rounded-xl border border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              SSI
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
              "mt-0.5 text-sm font-medium",
              SSI_COLOR(result.metrics.supplySecurityIndex),
            )}
          >
            {SSI_LABEL(result.metrics.supplySecurityIndex)}
          </div>
          <div className="mt-1.5 text-[10px] text-muted-foreground/50">
            weights 35/25/30/10
          </div>
        </div>
      </div>

      {/* Node impacts */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-1">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Node Impact Breakdown
          </h3>
          <span className="ml-auto text-xs text-muted-foreground/50">
            click to expand rationale
          </span>
        </div>
        {result.nodeImpacts.map((impact) => (
          <NodeImpactRow key={impact.nodeId} impact={impact} />
        ))}
      </div>

      {/* Assumptions */}
      <AssumptionsPill assumptions={result.metrics.assumptions} />

      {/* SSI weight decomposition */}
      <div className="solid-card rounded-xl border border-white/10 p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          SSI Weight Decomposition
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              label: "National Reserve Runway",
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
              className="solid-card rounded-lg border border-white/10 p-4"
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
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScenarioSimulator() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    DISRUPTION_PRESETS[0].id,
  );
  const [leverState, setLeverState] = useState<LeverState>(DEFAULT_LEVER_STATE);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { baseline, withLevers, loading, error, runBaseline, runWithLevers, reset } =
    useSimulation();

  const selectedPreset = DISRUPTION_PRESETS.find(
    (p) => p.id === selectedPresetId,
  )!;

  const handleRunBaseline = async () => {
    await runBaseline(selectedPresetId);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleApplyLevers = async () => {
    const levers = buildLeversArray(leverState);
    await runWithLevers(selectedPresetId, levers);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    reset();
    setLeverState(DEFAULT_LEVER_STATE);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-transparent">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10">
              <FlaskConical className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <h1 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                Scenario Simulator
              </h1>
              <p className="text-xs text-muted-foreground/60">
                Deterministic capacity-constrained propagation · Triangular range estimates
              </p>
            </div>
            {(baseline || withLevers) && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  setLeverState(DEFAULT_LEVER_STATE);
                }}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-white/10 hover:border-white/20"
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

          {/* ── Left: Preset selector ── */}
          {/* ── Left: Preset selector ── */}
          <DisruptionPresetSelector
            selectedPresetId={selectedPresetId}
            onPresetChange={handlePresetChange}
            onRunBaseline={handleRunBaseline}
            loading={loading}
            hasBaseline={baseline !== null}
            error={error}
          />

          {/* ── Right: Preset detail + Decision Levers ── */}
          <div className="sticky top-[88px] max-h-[calc(100vh-120px)] overflow-y-auto space-y-4 pb-4">
            {/* Preset detail card */}
            <div className="solid-card rounded-xl border border-white/10 p-5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Selected Scenario
              </div>
              <h2 className="text-sm font-bold text-foreground">{selectedPreset.label}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedPreset.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Severity",
                    val: `${selectedPreset.severityPct}%`,
                    sub: `range ${selectedPreset.severityRange.min}–${selectedPreset.severityRange.max}%`,
                    color: SEVERITY_COLOR(selectedPreset.severityPct),
                  },
                  {
                    label: "Duration",
                    val: `${selectedPreset.expectedDurationDays}d`,
                    sub: `range ${selectedPreset.durationRange.min}–${selectedPreset.durationRange.max}d`,
                    color: "text-foreground",
                  },
                  {
                    label: "Freight Penalty",
                    val: `+${selectedPreset.spotFreightPenaltyPct}%`,
                    sub: "spot charter rate",
                    color: "text-orange-400",
                  },
                  {
                    label: "War-Risk Premium",
                    val: `${selectedPreset.insurancePremiumPeakBps}bps`,
                    sub: "peak",
                    color: "text-yellow-400",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-[#0e1319] border border-white/8 px-3 py-2.5">
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    <div className={cn("text-xl font-bold", item.color)}>{item.val}</div>
                    <div className="text-[10px] text-muted-foreground/60">{item.sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <div className="mb-1.5 text-[10px] text-muted-foreground/60">Affected nodes</div>
                <div className="flex flex-wrap gap-1">
                  {selectedPreset.affectedNodeIds.map((id) => (
                    <span
                      key={id}
                      className="rounded border border-white/8 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70"
                    >
                      {id.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Engine methodology note */}
            <div className="solid-card rounded-xl border border-white/5 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Zap className="size-3.5 text-muted-foreground/60" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Engine
                </span>
              </div>
              <ul className="space-y-0.5 text-xs text-muted-foreground/50">
                <li>BFS propagation through India trade graph</li>
                <li>Capacity-constrained · 20 annotated nodes</li>
                <li>Transit vs. production node branching</li>
                <li>Route-family deduplication</li>
                <li>Port-corridor flow fraction scaling</li>
                <li>SSI weights: 35/25/30/10</li>
              </ul>
            </div>

            {/* Decision Levers panel */}
            <DecisionLevers
              levers={leverState}
              onChange={setLeverState}
              onApply={handleApplyLevers}
              hasBaseline={baseline !== null}
              loading={loading}
            />
          </div>
        </div>

        {/* ── Route Impact Map ── full width, visible as soon as preset is selected ── */}
        <motion.div
          key={selectedPreset.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#06080a]/60 p-1 shadow-2xl backdrop-blur-md"
        >
          <ScenarioMap
            preset={selectedPreset}
            levers={leverState}
            hasRun={baseline !== null}
          />
        </motion.div>

        {/* ── Results ── */}
        <AnimatePresence>
          {baseline && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-10 space-y-8"
            >
              {/* Section header — sits over empty page space, needs strong contrast */}
              <div className="solid-card flex items-center justify-between rounded-xl border border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Activity className="size-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Simulation Results
                      {withLevers && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          — baseline + lever comparison
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground/60">
                      Computed{" "}
                      {new Date(baseline.result.computedAt).toLocaleTimeString()} ·{" "}
                      {baseline.result.nodeImpacts.length} nodes ·{" "}
                      {baseline.result.metrics.assumptions.length} caveats
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-3xl font-black tabular-nums",
                      SSI_COLOR(baseline.result.metrics.supplySecurityIndex),
                    )}
                  >
                    {baseline.result.metrics.supplySecurityIndex}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SSI · {SSI_LABEL(baseline.result.metrics.supplySecurityIndex)}
                  </div>
                </div>
              </div>

              {/* Delta comparison (appears only when a lever run exists) */}
              {withLevers && (
                <MetricsComparison
                  baseline={baseline.result}
                  withLevers={withLevers.result}
                />
              )}

              {/* Node Trajectory card — below Metrics Comparison */}
              {baseline && (
                <NodeTrajectoryCard
                  baseline={baseline.result}
                  withLevers={withLevers?.result ?? null}
                  preset={selectedPreset}
                />
              )}

              {/* Baseline full results */}
              <div>
                {withLevers && (
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Baseline — no levers applied
                  </h3>
                )}
                <ResultsSection result={baseline.result} />
              </div>

              {/* With-levers full results */}
              {withLevers && (
                <div>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    With levers applied
                  </h3>
                  <ResultsSection result={withLevers.result} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
