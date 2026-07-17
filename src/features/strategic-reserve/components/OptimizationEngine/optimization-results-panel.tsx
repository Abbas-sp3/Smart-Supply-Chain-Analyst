"use client";

import { useMemo } from "react";
import type { PropagationResult } from "@/features/scenario-simulator/types";
import { generateOptimizationStrategy } from "@/features/strategic-reserve/services/optimizationEngine";
import { RecommendationCard } from "./recommendation-card";
import { RefineryPriorityList } from "./refinery-priority-list";
import { ReasoningDisclosure } from "./reasoning-disclosure";
import { Calculator } from "lucide-react";

export function OptimizationResultsPanel({ result }: { result: PropagationResult }) {
  const strategy = useMemo(() => generateOptimizationStrategy(result), [result]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-foreground font-semibold uppercase tracking-wider text-sm mb-4 border-b border-white/10 pb-4">
        <Calculator className="size-4 text-emerald-400" />
        Deterministic Drawdown Optimization
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <RecommendationCard strategy={strategy} />
          <ReasoningDisclosure reasoning={strategy.reasoning} />
        </div>
        
        <div>
          <RefineryPriorityList prioritizedRefineries={strategy.prioritizedRefineries} />
        </div>
      </div>
    </div>
  );
}
