"use client";

/**
 * StrategicImplications — Strategic vulnerability summary
 */

import { AlertCircle } from "lucide-react";

import { useCountry } from "@/hooks/useCountry";

type Props = { content: string };

export function StrategicImplications({ content }: Props) {
  const { activeCountry } = useCountry();
  return (
    <section className="glass-panel border-primary/20 p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <AlertCircle aria-hidden className="size-4 shrink-0 text-amber-400/80" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
          Why {activeCountry.name} Should Care
        </h2>
      </header>
      <p className="text-sm leading-relaxed text-foreground/90">{content}</p>
    </section>
  );
}
