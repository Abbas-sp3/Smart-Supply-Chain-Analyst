"use client";

/**
 * ExecutiveSummary — Top-level intelligence overview card
 */

import { FileText } from "lucide-react";

type Props = { summary: string };

export function ExecutiveSummary({ summary }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <FileText aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Executive Summary
        </h2>
      </header>
      <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
    </section>
  );
}
