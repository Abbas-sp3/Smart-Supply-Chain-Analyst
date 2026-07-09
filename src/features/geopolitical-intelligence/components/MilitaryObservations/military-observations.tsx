import { Plane } from "lucide-react";
import type { MilitaryObservation } from "../../types";

export function MilitaryObservations({
  observations,
}: {
  observations: MilitaryObservation[];
}) {
  if (observations.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/80">
          <Plane aria-hidden className="size-3.5 text-indigo-400" />
          Military Logistics Aviation
        </h2>
      </div>
      <div className="px-5 py-2">
        <p className="text-[10px] text-muted-foreground italic border-b border-white/5 pb-2 mb-2">
          Note: Military logistics movement is one intelligence signal among many and should not be used in isolation to draw operational conclusions.
        </p>
        <div className="divide-y divide-white/5">
          {observations.map((obs, idx) => (
            <div key={idx} className="py-3">
              <p className="text-sm font-medium text-foreground/90">
                {obs.activity}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/60">Implication:</span>{" "}
                {obs.implication}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
