"use client";

/**
 * Recommendations — Actionable recommendations with priority badges
 * Priority language is always qualitative — no percentages allowed.
 */

import { ShieldAlert } from "lucide-react";
import type { Recommendation } from "../../types";

type Props = { recommendations: Recommendation[] };

const PRIORITY_CONFIG: Record<string, { classes: string; dot: string }> = {
  Critical: {
    classes: "border-red-500/40 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
  },
  High: {
    classes: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    dot: "bg-orange-400",
  },
  Medium: {
    classes: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  Low: {
    classes: "border-white/10 bg-white/[0.04] text-muted-foreground",
    dot: "bg-white/30",
  },
};

function getPriorityConfig(priority: string) {
  return (
    PRIORITY_CONFIG[priority] ??
    PRIORITY_CONFIG.Low
  );
}

export function Recommendations({ recommendations }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <ShieldAlert aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recommendations
        </h2>
      </header>

      <ol className="space-y-3">
        {recommendations.map((item, i) => {
          const config = getPriorityConfig(item.priority);
          return (
            <li
              key={i}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 shrink-0 rounded-full ${config.dot}`} />
                  <h3 className="text-sm font-semibold text-foreground/90">
                    {item.title}
                  </h3>
                </div>
                <span
                  className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.classes}`}
                >
                  {item.priority}
                </span>
              </div>
              <p className="mb-1.5 text-xs leading-relaxed text-foreground/80">
                {item.description}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="mr-1 font-medium text-primary/60">Rationale:</span>
                {item.reason}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
