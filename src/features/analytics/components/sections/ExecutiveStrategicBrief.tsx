"use client";

import { FileText, AlertTriangle, Shield, TrendingDown, Package, Info } from "lucide-react";
import type { AnalyticsSummary } from "@/features/analytics/services/analyticsEngine";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";

type Props = {
  insights: string[];
  activePreset: DisruptionPreset;
  summary: AnalyticsSummary;
};

export function ExecutiveStrategicBrief({ insights, activePreset, summary }: Props) {
  const activeAnalysis = summary.scenarioAnalyses.find(
    (s) => s.preset.id === activePreset.id
  );

  const severity =
    (activeAnalysis?.supplyGapMtpa ?? 0) > 20
      ? "critical"
      : (activeAnalysis?.supplyGapMtpa ?? 0) > 5
      ? "elevated"
      : "normal";

  const statusColor = {
    critical: "border-red-500/30 bg-red-500/[0.05]",
    elevated: "border-amber-500/30 bg-amber-500/[0.05]",
    normal: "border-emerald-500/30 bg-emerald-500/[0.05]",
  }[severity];

  const statusText = {
    critical: "CRITICAL",
    elevated: "ELEVATED",
    normal: "NORMAL",
  }[severity];

  const statusDot = {
    critical: "bg-red-500",
    elevated: "bg-amber-400",
    normal: "bg-emerald-400",
  }[severity];

  const iconMap = [FileText, AlertTriangle, Shield, TrendingDown, Package, Info];

  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="size-4 text-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
              Executive Strategic Brief
            </span>
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Current Operational Intelligence Summary
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active scenario: <span className="text-foreground/70">{activePreset.label}</span>
          </p>
        </div>

        <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${statusColor} shrink-0`}>
          <div className={`size-1.5 rounded-full animate-pulse ${statusDot}`} />
          <span className="text-[10px] font-bold tracking-widest text-foreground/80">
            THREAT LEVEL: {statusText}
          </span>
        </div>
      </div>

      {/* Stat bar */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/5 bg-[#181e28] p-3 text-center">
          <div className="text-xs text-muted-foreground">Active Supply Gap</div>
          <div className="mt-1 text-xl font-bold text-foreground tabular-nums">
            {activeAnalysis?.supplyGapMtpa.toFixed(1) ?? "—"}
            <span className="text-xs font-normal text-muted-foreground ml-1">Mtpa</span>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#181e28] p-3 text-center">
          <div className="text-xs text-muted-foreground">SPR Status</div>
          <div className={`mt-1 text-sm font-bold ${activeAnalysis?.sprRequired ? "text-red-400" : "text-emerald-400"}`}>
            {activeAnalysis?.sprRequired ? "RELEASE ADVISED" : "HOLD — NOT REQUIRED"}
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#181e28] p-3 text-center">
          <div className="text-xs text-muted-foreground">Est. Recovery</div>
          <div className="mt-1 text-xl font-bold text-foreground tabular-nums">
            {(activeAnalysis?.estimatedRecoveryDays ?? 0) > 0
              ? `${activeAnalysis?.estimatedRecoveryDays ?? 0}d`
              : "N/A"}
            <span className="text-xs font-normal text-muted-foreground ml-1">post-disruption</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-2.5">
        {insights.map((insight, i) => {
          const Icon = iconMap[i] ?? Info;
          const isWarning = insight.includes("severe") || insight.includes("critical") || insight.includes("recommended");
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#181e28] p-3"
            >
              <Icon
                className={`mt-0.5 size-4 shrink-0 ${isWarning ? "text-amber-400" : "text-sky-400/70"}`}
              />
              <p className="text-sm leading-relaxed text-foreground/80">{insight}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
