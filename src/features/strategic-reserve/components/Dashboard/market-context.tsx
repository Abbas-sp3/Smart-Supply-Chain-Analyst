"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle } from "lucide-react";

type CommodityItem = {
  name: string;
  value: string;
  price: number;
  currency_unit: string;
  unit: string;
};

export function MarketContext() {
  const [brent, setBrent] = useState<CommodityItem | null>(null);
  const [wti, setWti] = useState<CommodityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/procurement/live-price");
        if (!res.ok) {
          setFetchError(`API ${res.status}`);
          return;
        }
        const data = await res.json();

        if (!data?.commodities || !Array.isArray(data.commodities)) {
          setFetchError("Unexpected API shape");
          return;
        }

        // Try both the canonical 'value' key and a loose name match as fallback
        const findByValue = (v: string) =>
          data.commodities.find((c: CommodityItem) => c.value === v);
        const findByName = (n: string) =>
          data.commodities.find((c: CommodityItem) =>
            c.name?.toLowerCase().includes(n)
          );

        const b = findByValue("brent_crude_oil") ?? findByName("brent");
        const w = findByValue("crude_oil") ?? findByName("wti");

        if (b) setBrent(b);
        if (w) setWti(w);

        // If neither found, report what values ARE available for debugging
        if (!b && !w) {
          const available = data.commodities.slice(0, 3).map((c: CommodityItem) => c.value).join(", ");
          setFetchError(`Prices not in response. Available: ${available || "none"}`);
        } else {
          setFetchError(null);
        }
      } catch (e: any) {
        setFetchError(e?.message ?? "Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
    const id = setInterval(fetchPrices, 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[72px] animate-pulse items-center gap-6 rounded-xl border border-white/10 bg-[#10151d] px-6">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-8 w-px bg-white/10" />
        <div className="h-4 w-24 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="solid-card flex flex-wrap items-center gap-6 rounded-xl border border-white/10 px-6 py-4">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Activity className="size-4" />
        Market Context
      </div>

      <div className="h-8 w-px bg-white/10" />

      <div className="flex flex-1 flex-wrap items-center gap-8">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Brent Crude</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-foreground">
              {brent && brent.price > 0 ? `$${brent.price.toFixed(2)}` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">/ bbl</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">WTI Crude</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-foreground">
              {wti && wti.price > 0 ? `$${wti.price.toFixed(2)}` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">/ bbl</span>
          </div>
        </div>

        {fetchError && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400/70">
            <AlertCircle className="size-3.5" />
            {fetchError}
          </div>
        )}
      </div>
    </div>
  );
}
