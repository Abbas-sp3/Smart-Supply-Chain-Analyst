"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp, Minus, Activity } from "lucide-react";

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

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/procurement/live-price");
        if (!res.ok) return;
        const data = await res.json();
        
        const b = data.commodities.find((c: CommodityItem) => c.value === "brent_crude_oil");
        const w = data.commodities.find((c: CommodityItem) => c.value === "crude_oil");
        
        if (b) setBrent(b);
        if (w) setWti(w);
      } catch (e) {
        // ignore
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
      <div className="flex h-[72px] animate-pulse items-center gap-6 rounded-xl border border-white/5 bg-[#0e1319] px-6">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-8 w-px bg-white/10" />
        <div className="h-4 w-24 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="solid-card flex items-center gap-8 rounded-xl border border-white/10 px-6 py-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Activity className="size-4" />
        Market Context
      </div>
      
      <div className="h-8 w-px bg-white/10" />

      <div className="flex flex-1 items-center gap-8">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Brent Crude</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              {brent ? `$${brent.price.toFixed(2)}` : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">/ bbl</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">WTI Crude</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              {wti ? `$${wti.price.toFixed(2)}` : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">/ bbl</span>
          </div>
        </div>
      </div>
    </div>
  );
}
