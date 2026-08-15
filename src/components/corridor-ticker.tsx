"use client";

import { useEffect, useState } from "react";
import { readCorridorStatus } from "@/lib/signal-bus";
import { useCountry } from "@/hooks/useCountry";

type TickerEntry = {
  label: string;
  status: string;
  cssClass: string;
};

function statusCssClass(status: string): string {
  switch (status) {
    case "CRITICAL": return "severe";
    case "ELEVATED": return "elevated";
    case "NORMAL": return "normal";
    case "NO_SIGNAL": return "no-signal";
    default: return "insufficient";
  }
}

export function CorridorTicker() {
  const { activeCountry } = useCountry();
  
  const activeCorridors = Object.keys(activeCountry.corridorFractions)
    .sort((a, b) => activeCountry.corridorFractions[b] - activeCountry.corridorFractions[a])
    .slice(0, 4)
    .map(key => {
      if (key.includes("hormuz")) return "Hormuz";
      if (key.includes("suez")) return "Suez";
      if (key.includes("bab")) return "Bab-el-Mandeb";
      if (key.includes("malacca")) return "Malacca";
      if (key.includes("south_china")) return "South China Sea";
      if (key.includes("black_sea")) return "Black Sea";
      if (key.includes("cape")) return "Cape of Good Hope";
      return key.replace("corridor_", "");
    });

  const [entries, setEntries] = useState<TickerEntry[]>([]);

  useEffect(() => {
    setEntries(
      activeCorridors.map((label) => ({
        label,
        status: "N/A",
        cssClass: "insufficient",
      }))
    );
  }, [activeCountry.id]);

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

        setEntries((prev) => 
          prev.map((e) => {
            const apiCorridor = data.corridors.find(
              (c: { shortName?: string; name?: string }) =>
                c.shortName === e.label || c.name?.includes(e.label)
            );
            if (apiCorridor) {
              return {
                label: e.label,
                status: apiCorridor.status,
                cssClass: statusCssClass(apiCorridor.status),
              };
            }
            return e;
          })
        );
      } catch {
        // keep fallback
      }
    }

    fetchCorridorData();
    const id = setInterval(fetchCorridorData, 60_000);
    return () => clearInterval(id);
  }, [activeCountry.id]);

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
            {e.status === "NO_SIGNAL" ? "NO SIGNAL" : e.status}
          </span>
        </span>
      ))}
    </div>
  );
}
