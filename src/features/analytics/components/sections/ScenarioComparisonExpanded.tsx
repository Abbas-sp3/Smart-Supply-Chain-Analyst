"use client";

import { useState } from "react";
import { GitCompare, HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import type { ScenarioAnalysis } from "@/features/analytics/services/analyticsEngine";
import { AuditTrailModal } from "@/components/ui/AuditTrailModal";
import { runPropagation } from "@/features/scenario-simulator/services/propagationEngine";
import { generateOptimizationStrategy } from "@/features/strategic-reserve/services/optimizationEngine";

type Props = {
  scenarioAnalyses: ScenarioAnalysis[];
};

export function ScenarioComparisonExpanded({ scenarioAnalyses }: Props) {
  const [auditData, setAuditData] = useState<{
    title: string;
    reasoning: string[];
    metrics: any;
  } | null>(null);

  const sorted = [...scenarioAnalyses].sort((a, b) => b.supplyGapMtpa - a.supplyGapMtpa);
  const maxGap = Math.max(...sorted.map((s) => s.supplyGapMtpa), 0.1);

  function openAudit(analysis: ScenarioAnalysis) {
    const prop = runPropagation(analysis.preset, []);
    const opt = generateOptimizationStrategy(prop);
    setAuditData({
      title: `Decision Audit: ${analysis.preset.label}`,
      reasoning: opt.reasoning,
      metrics: {
        supplyGapMtpa: opt.supplyGapMtpa,
        breachesFloor: opt.breachesFloor,
        estimatedReplenishmentDays: opt.estimatedReplenishmentDays,
        targetDailyRateMtpa: opt.effectiveDailyRateMtpa,
      },
    });
  }

  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      <div className="mb-5 flex items-center gap-2">
        <GitCompare className="size-4 text-indigo-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          Scenario Comparison — All Presets
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="pb-3 pr-4 font-medium">Scenario</th>
              <th className="pb-3 pr-4 font-medium text-right">Supply Gap</th>
              <th className="pb-3 pr-4 font-medium text-right">Duration</th>
              <th className="pb-3 pr-4 font-medium text-right">Refineries</th>
              <th className="pb-3 pr-4 font-medium text-right">Locked Vol.</th>
              <th className="pb-3 pr-4 font-medium">SPR Required</th>
              <th className="pb-3 pr-4 font-medium">Primary Response</th>
              <th className="pb-3 font-medium text-center">Audit</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((analysis) => (
              <tr
                key={analysis.preset.id}
                className="border-b border-white/5 last:border-0 hover:bg-[#181e28] transition-colors"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {/* Gap bar */}
                    <div className="h-5 w-1.5 rounded-full bg-white/5 overflow-hidden shrink-0">
                      <div
                        className="w-full rounded-full bg-amber-500 transition-all"
                        style={{ height: `${(analysis.supplyGapMtpa / maxGap) * 100}%`, marginTop: "auto" }}
                      />
                    </div>
                    <span className="font-medium text-foreground/90 max-w-[180px] truncate" title={analysis.preset.label}>
                      {analysis.preset.label}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-right font-bold tabular-nums text-foreground">
                  {analysis.supplyGapMtpa.toFixed(1)}
                  <span className="ml-0.5 font-normal text-muted-foreground/60"> Mtpa</span>
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-foreground/70">
                  {analysis.durationDays}d
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-foreground/70">
                  {analysis.affectedRefineryCount}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-foreground/70">
                  {analysis.totalLockedVolumeMtpa.toFixed(1)}
                </td>
                <td className="py-3 pr-4">
                  {analysis.sprRequired ? (
                    <div className="flex items-center gap-1.5 text-red-400">
                      <XCircle className="size-3.5" />
                      <span className="text-[11px] font-semibold">YES</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      <span className="text-[11px] font-semibold">NO</span>
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-[10px] text-muted-foreground/70 max-w-[160px] block truncate" title={analysis.primaryResponse}>
                    {analysis.primaryResponse}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <button
                    onClick={() => openAudit(analysis)}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    <HelpCircle className="size-3" />
                    Why?
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AuditTrailModal
        isOpen={!!auditData}
        onClose={() => setAuditData(null)}
        title={auditData?.title}
        reasoning={auditData?.reasoning ?? []}
        metrics={auditData?.metrics}
      />
    </div>
  );
}
