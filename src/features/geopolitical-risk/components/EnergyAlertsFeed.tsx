"use client";
import { useState } from "react";


// Ported from carbon-evolution/horus AlertsView — energy-specific priority alert feed.
export type AlertSeverity = "high" | "medium" | "low";

export interface EnergyAlert {
  id: string;
  title: string;
  entity: string;    // e.g. "Strait of Hormuz" or "Mundra Port"
  severity: AlertSeverity;
  ago: string;       // e.g. "2h ago"
  href?: string;     // optional internal route
}

const ORDER: AlertSeverity[] = ["high", "medium", "low"];

const SEVERITY_STYLES: Record<AlertSeverity, { badge: string; dot: string }> = {
  high:   { badge: "bg-red-500/15 text-red-400 border border-red-500/30",    dot: "bg-red-400" },
  medium: { badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30", dot: "bg-amber-400" },
  low:    { badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
};

export function EnergyAlertsFeed({ alerts: allAlerts }: { alerts: EnergyAlert[] }) {
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");
  const alerts = allAlerts
    .filter((a) => filter === "all" || a.severity === filter)
    .sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));

  return (
    <div className="flex h-full flex-col gap-3">
      {/* filter bar */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Active Alerts ({alerts.length})
        </span>
        <div className="inline-flex rounded-lg border border-[var(--panel-border)] bg-[var(--panel-2)] p-0.5 text-xs">
          {(["all", ...ORDER] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                filter === f ? "bg-[var(--accent)] text-white" : "text-[var(--text-dim)] hover:text-[var(--text)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* alert list */}
      <ul className="flex-1 divide-y divide-[var(--panel-border)] overflow-y-auto">
        {alerts.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-start gap-3">
              {/* severity dot */}
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_STYLES[a.severity].dot}`} />
              <div className="min-w-0">
                <div className="line-clamp-2 text-sm leading-tight">{a.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_STYLES[a.severity].badge}`}>
                    {a.severity.toUpperCase()}
                  </span>
                  <span>{a.entity}</span>
                  <span>·</span>
                  <span>{a.ago}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
        {alerts.length === 0 && (
          <li className="py-6 text-center text-sm text-[var(--text-faint)]">No alerts at this severity.</li>
        )}
      </ul>
    </div>
  );
}
