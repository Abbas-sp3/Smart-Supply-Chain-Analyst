"use client";

/**
 * AffectedCategories — Import category impact grid
 */

import { Package } from "lucide-react";
import type { AffectedImportCategory } from "../../types";

type Props = { categories: AffectedImportCategory[] };

export function AffectedCategories({ categories }: Props) {
  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Package aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Affected Import Categories
        </h2>
      </header>

      <ul className="space-y-2">
        {categories.map((item, i) => (
          <li
            key={i}
            className="flex flex-col gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <span className="text-sm font-medium text-foreground/90">
              {item.category}
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
