"use client";

/**
 * AlternativeSupply — Alternative sourcing options identified by the AI
 */

import { ArrowRight } from "lucide-react";
import type { AlternativeSupplyOption } from "../../types";

type Props = { options: AlternativeSupplyOption[] };

export function AlternativeSupply({ options }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Alternative Supply Options
        </h2>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          AI-identified alternative sourcing paths for at-risk imports
        </p>
      </header>

      <ul className="space-y-3">
        {options.map((item, i) => (
          <li
            key={i}
            className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground/90">
                {item.product}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5">
                  {item.current_source}
                </span>
                <ArrowRight aria-hidden className="size-3 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {item.alternative_sources.map((src, j) => (
                    <span
                      key={j}
                      className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-400"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {item.reason}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
