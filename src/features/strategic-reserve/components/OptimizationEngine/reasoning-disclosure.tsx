"use client";

import { Info } from "lucide-react";

export function ReasoningDisclosure({ reasoning }: { reasoning: string[] }) {
  if (reasoning.length === 0) return null;

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Engine Reasoning & Constraints
      </h3>
      <div className="space-y-3">
        {reasoning.map((step, idx) => {
          const isWarning = step.includes("Warning") || step.includes("capped");
          return (
            <div key={idx} className="flex items-start gap-3 text-sm">
              <Info className={`size-4 mt-0.5 shrink-0 ${isWarning ? "text-orange-400" : "text-emerald-500"}`} />
              <span className={isWarning ? "text-orange-200" : "text-muted-foreground"}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
