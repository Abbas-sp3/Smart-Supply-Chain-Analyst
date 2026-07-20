"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

type PricePoint = { date: string; brent?: number; wti?: number };

type PriceStats = {
  current: number;
  change7d: number;
  change30d: number;
  volatility: number;
  trend: "up" | "down" | "flat";
};

function computeStats(series: PricePoint[], key: "brent" | "wti"): PriceStats | null {
  const filtered = series.filter((p) => p[key] !== undefined && p[key] !== null);
  if (filtered.length < 2) return null;
  const vals = filtered.map((p) => p[key]!);
  const current = vals[vals.length - 1];
  const ago7 = vals[Math.max(vals.length - 8, 0)];
  const ago30 = vals[Math.max(vals.length - 31, 0)];
  const change7d = current - ago7;
  const change30d = current - ago30;

  // Volatility = standard deviation of daily returns over the period
  const returns: number[] = [];
  for (let i = 1; i < vals.length; i++) {
    returns.push((vals[i] - vals[i - 1]) / vals[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // annualized %

  // Trend via simple 5-day slope
  const recent = vals.slice(-6);
  const slope = recent[recent.length - 1] - recent[0];
  const trend: "up" | "down" | "flat" = slope > 0.5 ? "up" : slope < -0.5 ? "down" : "flat";

  return { current, change7d, change30d, volatility, trend };
}

export function MarketAnalytics() {
  const [series, setSeries] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics/commodity-prices");
        if (!res.ok) throw new Error("Failed to load prices");
        const json = await res.json();
        if (mounted) setSeries(json.series ?? []);
      } catch (e: any) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const brentStats = series.length ? computeStats(series, "brent") : null;
  const wtiStats = series.length ? computeStats(series, "wti") : null;

  function DeltaBadge({ value }: { value: number }) {
    const pos = value > 0;
    const neutral = Math.abs(value) < 0.1;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
          neutral ? "text-muted-foreground" : pos ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {neutral ? <Minus className="size-3" /> : pos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {pos && "+"}${value.toFixed(2)}
      </span>
    );
  }

  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp className="size-4 text-emerald-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Market Analytics
        </span>
        {loading && <RefreshCw className="size-3.5 animate-spin text-muted-foreground ml-1" />}
        <span className="ml-auto text-[10px] text-muted-foreground/50">
          Yahoo Finance · Brent & WTI · 90-day
        </span>
      </div>

      {/* Stats cards */}
      {(brentStats || wtiStats) && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {brentStats && (
            <>
              <StatCard label="Brent Current" value={`$${brentStats.current.toFixed(2)}`} sub="/bbl" />
              <StatCard label="Brent 7d Change" value={<DeltaBadge value={brentStats.change7d} />} sub={`30d: ${brentStats.change30d > 0 ? "+" : ""}$${brentStats.change30d.toFixed(2)}`} />
            </>
          )}
          {wtiStats && (
            <>
              <StatCard label="WTI Current" value={`$${wtiStats.current.toFixed(2)}`} sub="/bbl" />
              <StatCard label="WTI Volatility" value={`${wtiStats.volatility.toFixed(1)}%`} sub="Annualized vol." />
            </>
          )}
        </div>
      )}

      {/* Chart */}
      {error ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-red-400">{error}</div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#ffffff50", fontSize: 9 }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#ffffff50", fontSize: 10 }}
                tickFormatter={(v) => `$${v}`}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#09090b", border: "1px solid #ffffff10", borderRadius: "8px", fontSize: "12px" }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#888", marginBottom: "4px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Line type="monotone" dataKey="brent" name="Brent Crude" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="wti" name="WTI Crude" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#181e28] p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-bold text-foreground">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</div>}
    </div>
  );
}
