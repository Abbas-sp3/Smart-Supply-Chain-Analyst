"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

type CommodityItem = {
  value: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  isStale?: boolean;
  history: number[];
};

const ENERGY_COMMODITY_META: Record<string, { unit: string }> = {
  "brent_crude_oil": { unit: "$/bbl" },
  "wti_crude_oil": { unit: "$/bbl" },
  "natural_gas": { unit: "$/MMBtu" },
  "coal": { unit: "$/mt" },
};

export function EnergyPriceMonitor() {
  const [commodities, setCommodities] = useState<CommodityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCommodities = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/procurement/live-price");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.commodities) && json.commodities.length > 0) {
          // Take top 3 for the dashboard panel
          setCommodities(json.commodities.slice(0, 3));
          return;
        }
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommodities();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadCommodities, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadCommodities]);

  if (loading && commodities.length === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-3">
        <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Fetching live prices...</span>
      </div>
    );
  }

  if (error && commodities.length === 0) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-3 text-red-400">
        <AlertCircle className="size-6 opacity-50" />
        <span className="text-xs uppercase tracking-widest text-center">Live feed unavailable<br/>Using fallback data in Procurement</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 justify-center">
      <div className="flex items-center gap-2 mb-1 px-1">
        <Clock className="size-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Live Feed Active</span>
      </div>
      
      {commodities.map((item) => {
        const meta = ENERGY_COMMODITY_META[item.value] || { unit: "" };
        const history = item.history || [];
        const chartData = history.map((val, i) => ({ value: val, index: i }));
        const min = history.length > 0 ? Math.min(...history) : 0;
        const max = history.length > 0 ? Math.max(...history) : 0;
        const padding = (max - min) * 0.1;

        return (
          <div key={item.value} className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-center justify-between group hover:bg-black/40 transition-colors">
            
            {/* Name & Price */}
            <div className="flex flex-col gap-1 w-1/3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.name}</span>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-black tabular-nums">{item.price}</span>
                <span className="text-[10px] text-muted-foreground mb-1">{meta.unit}</span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex-1 h-12 px-4 opacity-70 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={[min - padding, max + padding]} hide />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={item.isPositive ? "#34d399" : "#f87171"} 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Change % */}
            <div className="w-20 flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1 text-sm font-bold ${item.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {item.change}
              </div>
              {item.isStale && <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Delayed</span>}
            </div>

          </div>
        );
      })}
    </div>
  );
}
