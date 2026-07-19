"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle } from "lucide-react";

type PricePoint = { value: number; asOf: string; changePct: number | null };

export function MarketContext() {
  const [brent, setBrent] = useState<PricePoint | null>(null);
  const [wti, setWti] = useState<PricePoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/procurement/eia-price");
        if (!res.ok) {
          setFetchError(`API ${res.status}`);
          return;
        }
        const data = await res.json();
        const prices = data.prices;

        if (prices) {
          if (prices.brent) setBrent(prices.brent);
          if (prices.wti) setWti(prices.wti);
        }

        if (!prices || (!prices.brent && !prices.wti)) {
          setFetchError("Price data temporarily unavailable (EIA source unreachable)");
        } else {
          setFetchError(null);
        }
      } catch (e: any) {
        setFetchError("Price data temporarily unavailable (network error)");
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
              {brent && brent.value > 0 ? `$${brent.value.toFixed(2)}` : "—"}
            </span>
            <span className="text-xs text-muted-foreground">/ bbl</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">WTI Crude</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-foreground">
              {wti && wti.value > 0 ? `$${wti.value.toFixed(2)}` : "—"}
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
