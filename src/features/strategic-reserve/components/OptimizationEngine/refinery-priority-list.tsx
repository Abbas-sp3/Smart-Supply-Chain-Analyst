"use client";

import type { OptimizationRecommendation } from "@/features/strategic-reserve/services/optimizationEngine";
import { Factory, AlertCircle } from "lucide-react";

export function RefineryPriorityList({ 
  prioritizedRefineries 
}: { 
  prioritizedRefineries: OptimizationRecommendation["prioritizedRefineries"] 
}) {
  return (
    <div className="solid-card rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Factory className="size-3.5 text-sky-400" />
          Refinery Allocation Priority
        </h3>
        <span className="text-[10px] text-muted-foreground/60">
          Ranked by Feedstock Deficit
        </span>
      </div>
      
      {prioritizedRefineries.length === 0 ? (
        <div className="text-xs text-muted-foreground/80 italic p-6 text-center border border-dashed border-white/10 rounded-lg bg-white/[0.01]">
          No refinery lockups detected.
        </div>
      ) : (
        <div className="space-y-2.5">
          {prioritizedRefineries.map((ref, idx) => (
            <div key={ref.nodeId} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/8 hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-400">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {ref.name}
                  </div>
                  {ref.sharePct && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      National refining share: <span className="font-semibold text-sky-300">{ref.sharePct}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums text-rose-400">
                  {ref.lockedVolumeMtpa.toFixed(2)}
                </div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase">Mtpa Locked</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
