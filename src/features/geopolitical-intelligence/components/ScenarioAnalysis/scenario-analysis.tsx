import { Split } from "lucide-react";
import type { ScenarioAnalysis as ScenarioAnalysisType } from "../../types";

export function ScenarioAnalysis({
  scenarios,
}: {
  scenarios: ScenarioAnalysisType;
}) {
  if (!scenarios) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/80">
          <Split aria-hidden className="size-3.5 text-purple-400" />
          Scenario Projections
        </h2>
      </div>
      <div className="grid gap-px bg-white/5 sm:grid-cols-3">
        <div className="bg-background/95 px-5 py-4 backdrop-blur-xl">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-green-400/80">
            Best Case
          </h3>
          <p className="text-sm font-medium text-foreground/90">
            {scenarios.best_case.description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/60">Impact on India:</span>{" "}
            {scenarios.best_case.impact_on_india}
          </p>
        </div>
        <div className="bg-background/95 px-5 py-4 backdrop-blur-xl">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">
            Most Likely
          </h3>
          <p className="text-sm font-medium text-foreground/90">
            {scenarios.most_likely.description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/60">Impact on India:</span>{" "}
            {scenarios.most_likely.impact_on_india}
          </p>
        </div>
        <div className="bg-background/95 px-5 py-4 backdrop-blur-xl">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-red-400/80">
            Worst Case
          </h3>
          <p className="text-sm font-medium text-foreground/90">
            {scenarios.worst_case.description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/60">Impact on India:</span>{" "}
            {scenarios.worst_case.impact_on_india}
          </p>
        </div>
      </div>
    </div>
  );
}
