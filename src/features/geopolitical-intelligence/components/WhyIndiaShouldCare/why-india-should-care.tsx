"use client";

/**
 * WhyIndiaShouldCare — Strategic vulnerability summary
 */

import { AlertCircle } from "lucide-react";

type Props = { content: string };

export function WhyIndiaShouldCare({ content }: Props) {
  return (
    <section className="glass-panel border-primary/20 p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <AlertCircle aria-hidden className="size-4 shrink-0 text-amber-400/80" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
          Why India Should Care
        </h2>
      </header>
      <p className="text-sm leading-relaxed text-foreground/90">{content}</p>
    </section>
  );
}
