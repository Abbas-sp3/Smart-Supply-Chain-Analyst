"use client";

/**
 * SupportingEvidence — Source citations
 * Shows source + headline ONLY. Never displays full article content.
 */

import { BookOpen } from "lucide-react";
import type { SupportingEvidence } from "../../types";

type Props = { evidence: SupportingEvidence[] };

export function SupportingEvidence({ evidence }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <BookOpen aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Supporting Evidence
        </h2>
        <span className="ml-auto text-[10px] text-muted-foreground/50">
          Source citations only — no article content displayed
        </span>
      </header>

      <ul className="space-y-1.5">
        {evidence.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-2.5"
          >
            <span className="mt-0.5 shrink-0 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.source}
            </span>
            <span className="text-xs leading-relaxed text-foreground/70">
              {item.headline}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
