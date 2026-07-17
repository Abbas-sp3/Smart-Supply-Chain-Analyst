"use client";

import type { OptimizationRecommendation } from "@/features/strategic-reserve/services/optimizationEngine";
import { Factory } from "lucide-react";

export function RefineryPriorityList({ 
  prioritizedRefineries 
}: { 
  prioritizedRefineries: OptimizationRecommendation["prioritizedRefineries"] 
}) {
  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Refinery Allocation Priority
      </h3>
      
      {prioritizedRefineries.length === 0 ? (
        <div className="text-sm text-muted-foreground italic p-4 text-center border border-dashed border-white/10 rounded-lg">
          No refinery lockups detected.
        </div>
      ) : (
        <div className="space-y-3">
          {prioritizedRefineries.map((ref, idx) => (
            <div key={ref.nodeId} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-black/40 border border-white/10 text-xs font-bold text-muted-foreground">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Factory className="size-3.5 text-blue-400" />
                    {ref.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums text-foreground">
                  {ref.lockedVolumeMtpa.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground">MMTPA Locked</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
