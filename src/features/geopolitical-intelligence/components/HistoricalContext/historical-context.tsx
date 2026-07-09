import { History } from "lucide-react";
import type { HistoricalEvent } from "../../types";

export function HistoricalContext({
  events,
}: {
  events: HistoricalEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/5 bg-white/[0.02] px-5 py-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/80">
          <History aria-hidden className="size-3.5 text-slate-400" />
          Historical Precedents
        </h2>
      </div>
      <div className="divide-y divide-white/5">
        {events.map((ev, idx) => (
          <div key={idx} className="px-5 py-4">
            <p className="text-sm font-medium text-foreground/90">
              {ev.event}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/60">Relevance to current situation:</span>{" "}
              {ev.relevance}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
