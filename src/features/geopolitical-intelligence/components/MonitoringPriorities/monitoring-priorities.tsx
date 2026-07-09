import { Eye } from "lucide-react";
import type { MonitoringPriority } from "../../types";

export function MonitoringPriorities({
  priorities,
}: {
  priorities: MonitoringPriority[];
}) {
  if (priorities.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/80">
          <Eye aria-hidden className="size-3.5 text-teal-400" />
          Intelligence Monitoring Priorities
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {priorities.map((pri, idx) => (
          <div key={idx} className="px-5 py-4 flex gap-4">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-muted-foreground">
              {idx + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/90">
                {pri.priority}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/60">Reason:</span>{" "}
                {pri.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
