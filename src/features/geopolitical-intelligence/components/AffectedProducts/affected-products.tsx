"use client";

/**
 * AffectedProducts — Specific import products at risk
 */

import type { AffectedProduct } from "../../types";

type Props = { products: AffectedProduct[] };

export function AffectedProducts({ products }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Affected Products
        </h2>
      </header>

      <ul className="flex flex-wrap gap-2">
        {products.map((item, i) => (
          <li key={i} className="group relative">
            <span className="inline-block cursor-default rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-foreground">
              {item.product}
            </span>
            {/* Tooltip-style reason on hover */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 scale-95 rounded-lg border border-white/10 bg-[oklch(0.16_0.01_260)] px-3 py-2 text-[11px] leading-relaxed text-muted-foreground opacity-0 shadow-xl transition-all group-hover:scale-100 group-hover:opacity-100">
              {item.reason}
              <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-[oklch(0.16_0.01_260)]" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
