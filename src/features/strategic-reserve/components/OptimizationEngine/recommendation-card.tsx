"use client";

import type { OptimizationRecommendation } from "@/features/strategic-reserve/services/optimizationEngine";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AuditTrailModal } from "@/components/ui/AuditTrailModal";

export function RecommendationCard({ strategy }: { strategy: OptimizationRecommendation }) {
  const [showAudit, setShowAudit] = useState(false);

  return (
    <div className="solid-card relative overflow-hidden rounded-xl border border-white/10 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Engine Recommendation
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {strategy.recommendRelease ? (
              <span className="flex items-center gap-1.5 text-xl font-bold text-emerald-400">
                <CheckCircle2 className="size-6" />
                INITIATE DRAWDOWN
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xl font-bold text-muted-foreground">
                <XCircle className="size-6" />
                NO RELEASE REQUIRED
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAudit(true)}
          className="flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 transition-colors hover:bg-sky-500/20"
        >
          <HelpCircle className="size-3.5" />
          Why?
        </button>
      </div>

      {strategy.recommendRelease && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">Target Daily Rate</div>
            <div className="text-xl font-bold tabular-nums text-foreground">
              {(strategy.effectiveDailyRateMtpa * 1000).toFixed(1)}{" "}
              <span className="text-xs font-normal text-muted-foreground">kMT/day</span>
            </div>
            {strategy.cappedByRateLimit && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-400">
                <AlertTriangle className="size-3" /> Rate limited
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Volume</div>
            <div className="text-xl font-bold tabular-nums text-foreground">
              {strategy.totalVolumeDeployedMMT.toFixed(2)}{" "}
              <span className="text-xs font-normal text-muted-foreground">MMT</span>
            </div>
            {strategy.breachesFloor && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
                <AlertTriangle className="size-3" /> Hits floor at day {Math.floor(strategy.daysToFloor)}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">Replenish Window</div>
            <div className="text-xl font-bold tabular-nums text-foreground">
              {strategy.estimatedReplenishmentDays}{" "}
              <span className="text-xs font-normal text-muted-foreground">days</span>
            </div>
          </div>
        </div>
      )}

      <AuditTrailModal
        isOpen={showAudit}
        onClose={() => setShowAudit(false)}
        reasoning={strategy.reasoning}
        metrics={{
          supplyGapMtpa: strategy.supplyGapMtpa,
          breachesFloor: strategy.breachesFloor,
          estimatedReplenishmentDays: strategy.estimatedReplenishmentDays,
          targetDailyRateMtpa: strategy.effectiveDailyRateMtpa,
        }}
      />
    </div>
  );
}
