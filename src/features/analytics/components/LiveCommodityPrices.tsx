"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";

type PriceData = {
  date: string;
  brent?: number;
  wti?: number;
};

export function LiveCommodityPrices() {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadPrices() {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics/commodity-prices");
        if (!res.ok) throw new Error("Failed to load commodity prices");
        const json = await res.json();
        
        if (mounted && json.series) {
          setData(json.series);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPrices();
    
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="solid-card flex h-full flex-col overflow-hidden rounded-xl border border-white/10 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Live Commodity Trend
            </h3>
            <p className="text-xs text-muted-foreground/60">
              Last 90 days closing prices (Yahoo Finance)
            </p>
          </div>
        </div>
        {loading && (
          <RefreshCw className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-h-[300px]">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-400">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "#ffffff50", fontSize: 10 }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fill: "#ffffff50", fontSize: 10 }}
                tickFormatter={(val) => `$${val}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #ffffff10",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#888", marginBottom: "4px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Line 
                type="monotone" 
                dataKey="brent" 
                name="Brent Crude" 
                stroke="#38bdf8" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#38bdf8" }}
              />
              <Line 
                type="monotone" 
                dataKey="wti" 
                name="WTI Crude" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
