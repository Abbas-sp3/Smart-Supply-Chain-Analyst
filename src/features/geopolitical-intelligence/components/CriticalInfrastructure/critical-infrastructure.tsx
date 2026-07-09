import { Zap } from "lucide-react";
import type { CriticalInfrastructureRisk } from "../../types";

export function CriticalInfrastructure({
  infrastructure,
}: {
  infrastructure: CriticalInfrastructureRisk[];
}) {
  if (infrastructure.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/80">
          <Zap aria-hidden className="size-3.5 text-orange-400" />
          Critical Infrastructure at Risk
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {infrastructure.map((infra, idx) => (
          <div key={idx} className="px-5 py-4">
            <p className="text-sm font-medium text-foreground/90">
              {infra.infrastructure}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/60">Risk Profile:</span>{" "}
              {infra.risk}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
