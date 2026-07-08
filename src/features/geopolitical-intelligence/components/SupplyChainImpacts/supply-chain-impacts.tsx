"use client";

/**
 * SupplyChainImpacts — Possible supply chain consequences
 */

import { Zap } from "lucide-react";
import type { SupplyChainImpact } from "../../types";

type Props = { impacts: SupplyChainImpact[] };

export function SupplyChainImpacts({ impacts }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Zap aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Possible Supply Chain Impacts
        </h2>
      </header>

      <ul className="space-y-2">
        {impacts.map((item, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400/50" />
            <div>
              <p className="text-sm font-medium leading-snug text-foreground/90">
                {item.impact}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.reason}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
