"use client";

/**
 * KeyDevelopments — Renders AI-identified key developments with importance badges
 */

import { AlertTriangle, Info, Minus } from "lucide-react";
import type { KeyDevelopment } from "../../types";

type Props = { developments: KeyDevelopment[] };

const IMPORTANCE_CONFIG = {
  High: {
    classes: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: AlertTriangle,
  },
  Medium: {
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    icon: Info,
  },
  Low: {
    classes: "border-white/10 bg-white/[0.03] text-muted-foreground",
    icon: Minus,
  },
} as const;

function getImportanceConfig(importance: string) {
  const key = importance as keyof typeof IMPORTANCE_CONFIG;
  return IMPORTANCE_CONFIG[key] ?? IMPORTANCE_CONFIG.Low;
}

export function KeyDevelopments({ developments }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Key Developments
        </h2>
      </header>

      <ol className="space-y-3">
        {developments.map((dev, i) => {
          const config = getImportanceConfig(dev.importance);
          const Icon = config.icon;

          return (
            <li
              key={i}
              className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium leading-snug text-foreground/90">
                  {dev.title}
                </h3>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${config.classes}`}
                >
                  <Icon aria-hidden className="size-2.5" />
                  {dev.importance}
                </span>
              </div>
              <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                {dev.description}
              </p>
              <p className="text-xs leading-relaxed text-foreground/60">
                <span className="mr-1 font-medium text-primary/60">Impact:</span>
                {dev.why_it_matters}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
