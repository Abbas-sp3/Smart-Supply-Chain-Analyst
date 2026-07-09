import { Ship } from "lucide-react";
import type { MaritimeObservation } from "../../types";

export function MaritimeObservations({
  observations,
}: {
  observations: MaritimeObservation[];
}) {
  if (observations.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/80">
          <Ship aria-hidden className="size-3.5 text-blue-400" />
          Maritime Anomalies & Traffic
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {observations.map((obs, idx) => (
          <div key={idx} className="px-5 py-4">
            <p className="text-sm font-medium text-foreground/90">
              {obs.anomaly}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/60">Impact:</span>{" "}
              {obs.impact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
