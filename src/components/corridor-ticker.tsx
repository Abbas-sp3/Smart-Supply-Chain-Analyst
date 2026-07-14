"use client";

import { useEffect, useState } from "react";
import { readCorridorStatus } from "@/lib/signal-bus";

type TickerEntry = {
  label: string;
  status: string;
  cssClass: string;
};

const ALL_CORRIDORS = ["Hormuz", "Suez", "Bab-el-Mandeb", "Malacca"];

const FALLBACK: TickerEntry[] = ALL_CORRIDORS.map((label) => ({
  label,
  status: "N/A",
  cssClass: "insufficient",
}));

function statusCssClass(status: string): string {
  switch (status) {
    case "CRITICAL": return "severe";
    case "ELEVATED": return "elevated";
    case "NORMAL": return "normal";
    default: return "insufficient";
  }
}

export function CorridorTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>(FALLBACK);

  useEffect(() => {
    async function fetchCorridorData() {
      const cs = readCorridorStatus();
      if (cs) {
        const short = cs.corridorName.includes("Hormuz") ? "Hormuz"
          : cs.corridorName.includes("Suez") ? "Suez"
          : cs.corridorName.includes("Bab") ? "Bab-el-Mandeb"
          : cs.corridorName.includes("Malacca") ? "Malacca"
          : cs.corridorName;
        setEntries((prev) =>
          prev.map((e) =>
            e.label === short
              ? { ...e, status: cs.status, cssClass: statusCssClass(cs.status) }
              : e,
          ),
        );
        return;
      }

      try {
        const res = await fetch("/api/corridor-status");
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.corridors)) return;

        setEntries(
          ALL_CORRIDORS.map((label) => {
            const apiCorridor = data.corridors.find(
              (c: { shortName?: string; name?: string }) =>
                c.shortName === label || c.name?.includes(label),
            );
            if (apiCorridor) {
              return {
                label,
                status: apiCorridor.status,
                cssClass: statusCssClass(apiCorridor.status),
              };
            }
            return { label, status: "N/A", cssClass: "insufficient" };
          }),
        );
      } catch {
        // keep fallback
      }
    }

    fetchCorridorData();
    const id = setInterval(fetchCorridorData, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="corridor-ticker flex h-9 w-full items-center gap-4 border-b border-white/[0.04] bg-[#080b10] px-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
        Corridor Status
      </span>
      <span className="h-3 w-px bg-white/[0.06]" />
      {entries.map((e) => (
        <span key={e.label} className="corridor-ticker-item">
          <span className="text-muted-foreground/60">{e.label}</span>
          <span className={`corridor-ticker-status ${e.cssClass}`}>
            {e.status}
          </span>
        </span>
      ))}
    </div>
  );
}
