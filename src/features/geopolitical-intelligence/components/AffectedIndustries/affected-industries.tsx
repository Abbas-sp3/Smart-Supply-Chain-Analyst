"use client";

/**
 * AffectedIndustries — Industries at risk in India's import ecosystem
 */

import { Factory } from "lucide-react";
import type { AffectedIndustry } from "../../types";

type Props = { industries: AffectedIndustry[] };

export function AffectedIndustries({ industries }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Factory aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Affected Industries
        </h2>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {industries.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <span className="block text-sm font-medium text-foreground/90">
              {item.industry}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {item.reason}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
