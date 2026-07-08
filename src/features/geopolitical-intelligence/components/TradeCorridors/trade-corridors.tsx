"use client";

/**
 * TradeCorridors — Affected shipping and trade corridors
 */

import { Navigation } from "lucide-react";
import type { AffectedTradeCorridor } from "../../types";

type Props = { corridors: AffectedTradeCorridor[] };

export function TradeCorridors({ corridors }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Navigation aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Affected Trade Corridors
        </h2>
      </header>

      <ul className="space-y-2">
        {corridors.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-amber-400/60" />
              <span className="text-sm font-medium text-foreground/90">
                {item.corridor}
              </span>
            </div>
            <p className="pl-3.5 text-xs leading-relaxed text-muted-foreground">
              {item.reason}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
