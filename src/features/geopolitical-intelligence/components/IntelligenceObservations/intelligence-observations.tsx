import { Crosshair } from "lucide-react";
import type { IntelligenceObservation } from "../../types";

export function IntelligenceObservations({
  observations,
}: {
  observations: IntelligenceObservation[];
}) {
  if (observations.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/80">
          <Crosshair aria-hidden className="size-3.5 text-primary/70" />
          Intelligence Observations
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {observations.map((obs, idx) => (
          <div key={idx} className="px-5 py-4">
            <p className="text-sm font-medium text-foreground/90">
              {obs.observation}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/60">Significance:</span>{" "}
              {obs.significance}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
