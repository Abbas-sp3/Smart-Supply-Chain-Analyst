"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { PropagationResult, CorridorImpactResult } from "@/features/scenario-simulator/types";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";
import {
  INDIA_CORRIDOR_FRACTION,
  PORT_CORRIDOR_FRACTION,
} from "@/features/scenario-simulator/services/propagationEngine";
import { INDIA_TRADE_GRAPH } from "@/features/geopolitical-intelligence/knowledge-graph/indiaTradeGraph";

// ── helpers ─────────────────────────────────────────────────────────────────

function getNodeBaslineMtpa(impact: CorridorImpactResult, preset: DisruptionPreset): number {
  const node = INDIA_TRADE_GRAPH.find((n) => n.id === impact.nodeId);
  if (!node || !node.capacityMtpa) return 0;
  const util = (node.baseUtilizationPct ?? 75) / 100;

  if (node.type === "corridor") {
    const frac = INDIA_CORRIDOR_FRACTION[impact.nodeId] ?? 0.05;
    return node.capacityMtpa * util * frac;
  }

  if (node.type === "port") {
    // Find which disrupted corridor this port is affected by
    const activeCorridor = preset.affectedNodeIds.find(
      (id) => PORT_CORRIDOR_FRACTION[`${impact.nodeId}:${id}`] !== undefined,
    );
    const portFrac = activeCorridor
      ? (PORT_CORRIDOR_FRACTION[`${impact.nodeId}:${activeCorridor}`] ?? 0.20)
      : 0.20;
    return node.capacityMtpa * util * portFrac;
  }

  // production_output nodes
  return node.capacityMtpa * util;
}

type TrajectoryPoint = {
  day: number;
  baseline: number;
  disrupted: number | null;
  withLevers: number | null;
  lockedBaseline: number | null;
  lockedLevers: number | null;
};

function buildTrajectory(
  impact: CorridorImpactResult,
  withLeversImpact: CorridorImpactResult | null,
  preset: DisruptionPreset,
): TrajectoryPoint[] {
  const baselineMtpa = getNodeBaslineMtpa(impact, preset);
  const lagDays = impact.lagDays ?? 0;
  const duration = preset.expectedDurationDays;
  const recoveryDays = Math.min(duration * 0.6, 30);
  const rampDays = 3;
  const totalDays = 14 + lagDays + duration + Math.ceil(recoveryDays) + 14;

  // Use lockedVolumeMtpa if > 0 (to show lever improvements), otherwise fallback to physical severity gap
  const disruptedGap = impact.lockedVolumeMtpa || (baselineMtpa * impact.effectiveSeverityPct / 100);
  const disruptedLevel = Math.max(0, baselineMtpa - disruptedGap);
  
  const lockedBase = impact.lockedVolumeMtpa ?? 0;
  const lockedLeversVal = withLeversImpact?.lockedVolumeMtpa ?? null;
  
  const leverGapVal = withLeversImpact?.lockedVolumeMtpa || (withLeversImpact ? (baselineMtpa * withLeversImpact.effectiveSeverityPct / 100) : 0);
  const withLeversLevel = withLeversImpact ? Math.max(0, baselineMtpa - leverGapVal) : null;

  const points: TrajectoryPoint[] = [];

  for (let dayOffset = -14; dayOffset <= totalDays - 14; dayOffset++) {
    // t is the day relative to disruption onset (0 = disruption begins)
    const t = dayOffset;

    let disrupted: number;
    let withL: number | null = null;
    let lockedB: number | null = null;
    let lockedL: number | null = null;

    if (t < 0) {
      // Pre-disruption: flat baseline
      disrupted = baselineMtpa;
      withL = withLeversLevel !== null ? baselineMtpa : null;
      lockedB = 0;
      lockedL = withLeversLevel !== null ? 0 : null;
    } else if (t < lagDays) {
      // Buffer phase: still at baseline (lag absorbs shock)
      disrupted = baselineMtpa;
      withL = withLeversLevel !== null ? baselineMtpa : null;
      lockedB = 0;
      lockedL = withLeversLevel !== null ? 0 : null;
    } else if (t < lagDays + rampDays) {
      // Ramp-down phase: linear decline over rampDays
      const rampProgress = (t - lagDays) / rampDays;
      disrupted = baselineMtpa - rampProgress * (baselineMtpa - disruptedLevel);
      withL = withLeversLevel !== null
        ? baselineMtpa - rampProgress * (baselineMtpa - withLeversLevel)
        : null;
      lockedB = rampProgress * lockedBase;
      lockedL = withLeversLevel !== null ? rampProgress * (lockedLeversVal ?? 0) : null;
    } else if (t < lagDays + rampDays + duration) {
      // Peak disruption: hold at reduced level
      disrupted = disruptedLevel;
      withL = withLeversLevel !== null ? withLeversLevel : null;
      lockedB = lockedBase;
      lockedL = withLeversLevel !== null ? (lockedLeversVal ?? 0) : null;
    } else if (t < lagDays + rampDays + duration + recoveryDays) {
      // Recovery ramp: linear back to baseline
      const recovProgress = (t - (lagDays + rampDays + duration)) / recoveryDays;
      disrupted = disruptedLevel + recovProgress * (baselineMtpa - disruptedLevel);
      withL = withLeversLevel !== null
        ? withLeversLevel + recovProgress * (baselineMtpa - withLeversLevel)
        : null;
      lockedB = lockedBase * (1 - recovProgress);
      lockedL = withLeversLevel !== null ? (lockedLeversVal ?? 0) * (1 - recovProgress) : null;
    } else {
      // Post-recovery: back to baseline
      disrupted = baselineMtpa;
      withL = withLeversLevel !== null ? baselineMtpa : null;
      lockedB = 0;
      lockedL = withLeversLevel !== null ? 0 : null;
    }

    points.push({
      day: t,
      baseline: baselineMtpa,
      disrupted,
      withLevers: withL,
      lockedBaseline: lockedB,
      lockedLevers: lockedL,
    });
  }

  return points;
}

// ── Tooltip components ────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: "#0a0e14",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "#f0f4f8",
};

function VolumeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0e14] p-2 text-xs shadow-xl">
      <div className="font-semibold text-muted-foreground mb-1.5">Day {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}</span>
          </span>
          <span className="font-medium tabular-nums text-foreground">{Number(p.value).toFixed(2)} Mtpa</span>
        </div>
      ))}
    </div>
  );
}

function LockedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0e14] p-2 text-xs shadow-xl">
      <div className="font-semibold text-muted-foreground mb-1.5">Day {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.stroke ?? p.fill }} />
            <span className="text-muted-foreground">{p.name}</span>
          </span>
          <span className="font-medium tabular-nums text-foreground">{Number(p.value).toFixed(2)} Mtpa</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type NodeTrajectoryCardProps = {
  baseline: PropagationResult;
  withLevers: PropagationResult | null;
  preset: DisruptionPreset;
};

export function NodeTrajectoryCard({ baseline, withLevers, preset }: NodeTrajectoryCardProps) {
  // Filter to nodes with meaningful impact, sort by severity desc
  const tabNodes = useMemo(() => {
    return baseline.nodeImpacts
      .filter((n) => (n.lockedVolumeMtpa ?? 0) > 0 || n.effectiveSeverityPct > 0)
      .sort((a, b) => b.effectiveSeverityPct - a.effectiveSeverityPct);
  }, [baseline.nodeImpacts]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeImpact = useMemo(() => {
    const id = selectedId ?? tabNodes[0]?.nodeId;
    return tabNodes.find((n) => n.nodeId === id) ?? tabNodes[0] ?? null;
  }, [selectedId, tabNodes]);

  const withLeversImpact = useMemo(() => {
    if (!withLevers || !activeImpact) return null;
    return withLevers.nodeImpacts.find((n) => n.nodeId === activeImpact.nodeId) ?? null;
  }, [withLevers, activeImpact]);

  const leverHasEffect = useMemo(() => {
    if (!withLeversImpact || !activeImpact) return false;
    const severityChanged = Math.abs(withLeversImpact.effectiveSeverityPct - activeImpact.effectiveSeverityPct) > 0.1;
    const lockedChanged = Math.abs((withLeversImpact.lockedVolumeMtpa ?? 0) - (activeImpact.lockedVolumeMtpa ?? 0)) > 0.1;
    return severityChanged || lockedChanged;
  }, [activeImpact, withLeversImpact]);

  const trajectoryData = useMemo(() => {
    if (!activeImpact) return [];
    return buildTrajectory(activeImpact, withLeversImpact, preset);
  }, [activeImpact, withLeversImpact, preset]);

  const baselineMtpa = useMemo(() => {
    if (!activeImpact) return 0;
    return getNodeBaslineMtpa(activeImpact, preset);
  }, [activeImpact, preset]);

  const peakGap = activeImpact?.lockedVolumeMtpa || (baselineMtpa * (activeImpact?.effectiveSeverityPct ?? 0) / 100);
  const leverGap = withLeversImpact
    ? (withLeversImpact.lockedVolumeMtpa || (baselineMtpa * withLeversImpact.effectiveSeverityPct / 100))
    : null;
  const recoveryDay = (activeImpact?.lagDays ?? 0) + 3 + preset.expectedDurationDays;

  const isFallback = (activeImpact?.lockedVolumeMtpa ?? 0) === 0 && (activeImpact?.effectiveSeverityPct ?? 0) > 0;

  if (tabNodes.length === 0) return null;

  return (
    <div className="glass-surface rounded-xl border border-white/10 p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Node Trajectory
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            Per-node volume before, during, and after disruption
          </p>
        </div>
      </div>

      {/* Tab selector — Procurement-style pill tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-white/5 pb-3">
        {tabNodes.map((n) => {
          const isActive = (selectedId ?? tabNodes[0]?.nodeId) === n.nodeId;
          const typeColor =
            n.nodeType === "corridor"
              ? isActive ? "bg-violet-500/20 text-violet-300" : "text-muted-foreground hover:text-violet-300"
              : n.nodeType === "port"
                ? isActive ? "bg-sky-500/20 text-sky-300" : "text-muted-foreground hover:text-sky-300"
                : isActive ? "bg-orange-500/20 text-orange-300" : "text-muted-foreground hover:text-orange-300";
          return (
            <button
              key={n.nodeId}
              type="button"
              onClick={() => setSelectedId(n.nodeId)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                typeColor,
              )}
            >
              {n.nodeLabel}
            </button>
          );
        })}
      </div>

      {activeImpact && (
        <>
          {/* Summary stat row — Procurement style */}
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-white/25" />
              Baseline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-[#e8935a]" />
              Disrupted
            </span>
            {withLevers && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-[#4fd1d9]" />
                With levers
              </span>
            )}
            <span className="ml-auto text-muted-foreground/60 tabular-nums">
              Pre-disruption: <strong className="text-foreground">{baselineMtpa.toFixed(1)} Mtpa</strong>
            </span>
            <span className="text-muted-foreground/60 tabular-nums">
              Peak gap: <strong className="text-red-400">−{peakGap.toFixed(1)} Mtpa</strong>
            </span>
            {leverGap !== null && (
              <span className="text-muted-foreground/60 tabular-nums">
                Gap w/ levers: <strong className="text-teal-400">−{leverGap.toFixed(1)} Mtpa</strong>
              </span>
            )}
            <span className="text-muted-foreground/60 tabular-nums">
              Recovery starts: <strong className="text-foreground">Day +{recoveryDay}</strong>
            </span>
          </div>

          {/* Lever has no effect / Fallback notices */}
          <div className="mb-2 flex flex-col gap-1.5">
            {withLevers && !leverHasEffect && (
              <div className="w-fit rounded-md bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground/50">
                Lever had no effect on this node.
              </div>
            )}
            {isFallback && (
              <div className="w-fit rounded-md bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 text-[10px] text-yellow-500/80">
                Physical throughput reduction (not systemic stranded volume)
              </div>
            )}
          </div>

          {/* Chart 1 — Volume Trajectory */}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
            Volume Trajectory (Mtpa)
          </div>
          <div className="h-44 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v) => `D${v >= 0 ? "+" : ""}${v}`}
                  minTickGap={24}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v) => `${v.toFixed(0)}`}
                  domain={[0, Math.ceil(baselineMtpa * 1.1)]}
                />
                <Tooltip content={<VolumeTooltip />} />
                <ReferenceLine
                  x={0}
                  stroke="rgba(232, 147, 90, 0.5)"
                  strokeDasharray="4 3"
                  label={{
                    value: "Day 0 — Disruption",
                    position: "insideTopRight",
                    fill: "rgba(232, 147, 90, 0.7)",
                    fontSize: 10,
                    offset: 6,
                  }}
                />
                <Line
                  type="linear"
                  dataKey="baseline"
                  name="Baseline"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="disrupted"
                  name="Disrupted"
                  stroke="#e8935a"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {withLevers && (
                  <Line
                    type="monotone"
                    dataKey="withLevers"
                    name="With levers"
                    stroke="#4fd1d9"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 — Locked/Stranded Volume */}
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mt-4 mb-1">
            Stranded Volume (Mtpa)
          </div>
          <div className="h-28 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lockedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8935a" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e8935a" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="leverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4fd1d9" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4fd1d9" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v) => `D${v >= 0 ? "+" : ""}${v}`}
                  minTickGap={24}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  domain={[0, "auto"]}
                />
                <Tooltip content={<LockedTooltip />} />
                <ReferenceLine
                  x={0}
                  stroke="rgba(232, 147, 90, 0.35)"
                  strokeDasharray="4 3"
                />
                <Area
                  type="monotone"
                  dataKey="lockedBaseline"
                  name="Locked (no levers)"
                  stroke="#e8935a"
                  strokeWidth={1.5}
                  fill="url(#lockedGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
                {withLevers && (
                  <Area
                    type="monotone"
                    dataKey="lockedLevers"
                    name="Locked (with levers)"
                    stroke="#4fd1d9"
                    strokeWidth={1.5}
                    fill="url(#leverGrad)"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Honesty disclosure footnote */}
          <p className="mt-3 text-[10px] leading-snug text-muted-foreground/40">
            Trajectory shape — buffer hold, 3-day ramp-down, plateau, recovery — is a deterministic model derived from
            engine outputs (lagDays, effectiveSeverityPct, expectedDurationDays). Recovery ramp duration is hardcoded to{" "}
            <code className="text-muted-foreground/60">min(duration × 0.6, 30)</code> days — an arbitrary modeled parameter,
            not empirically calibrated. Actual disruption recovery timelines may differ significantly. No historical
            calibration has been applied to these curve shapes.
          </p>
        </>
      )}
    </div>
  );
}
