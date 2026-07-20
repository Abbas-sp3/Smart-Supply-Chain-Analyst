"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Package, FileText, RefreshCw, TrendingUp, TrendingDown,
  BarChart3, Zap, Flame, Thermometer, Droplets, Hexagon, Ship, Train, Truck,
  Clock,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
  ReferenceLine,
} from "recharts";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

const lineDrawCSS = `
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
`;

type RankTier = "recommended" | "viable" | "caution";

const TIER_STYLES: Record<RankTier, string> = {
  recommended: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  viable: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  caution: "border-orange-500/30 bg-orange-500/10 text-orange-400",
};

const TIER_LABEL: Record<RankTier, string> = {
  recommended: "RECOMMENDED",
  viable: "VIABLE",
  caution: "CAUTION",
};

type Alternative = {
  option_number: number;
  source: string;
  commodity: string;
  tier: RankTier;
  summary: string;
  detail: string[];
  compatibility: string;
  diplomatic_perspective: string[];
  source_article: { title: string; url: string } | null;
};

type CommodityItem = {
  exchange: string; name: string; value: string; category: string;
  price: number; updated: number; currency_unit: string; unit: string;
};

type ForecastPoint = {
  date: string;
  brent?: number; wti?: number;
  brent_predicted?: number; wti_predicted?: number;
  natural_gas?: number; natural_gas_predicted?: number;
  heating_oil?: number; heating_oil_predicted?: number;
  brent_ema8?: number; wti_ema8?: number;
  natural_gas_ema8?: number; heating_oil_ema8?: number;
  brent_ema21?: number; wti_ema21?: number;
  natural_gas_ema21?: number; heating_oil_ema21?: number;
};

type ProcurementData = {
  generated_at: string;
  executive_summary: string;
  historical_comparison: string;
  alternatives: Alternative[];
  disclaimer: string;
  fallback?: boolean;
};

type ReplaySnapshot = {
  date: string;
  news_context_note: string;
  system_recommendation: {
    executive_summary: string;
    top_option: string;
    tier: "recommended" | "viable" | "caution";
  };
  actual_outcome: {
    real_price_brent: number | null;
    real_price_wti: number | null;
    documented_response: string;
    source_url: string | null;
  };
  lead_time_days: number | null;
};

const COMMODITY_TRANSPORT: Record<string, { mode: string; icon: string; caution?: string }> = {
  crude_oil: { mode: "Crude tanker (VLCC/ULCC) or pipeline", icon: "ship", caution: "Never airlift for bulk crude" },
  brent_crude_oil: { mode: "Crude tanker (VLCC/ULCC)", icon: "ship", caution: "Never airlift for bulk crude" },
  lng: { mode: "LNG carrier (cryogenic)", icon: "ship", caution: "Regasification terminal required" },
  natural_gas: { mode: "Pipeline or LNG carrier", icon: "train" },
  coal: { mode: "Bulk carrier (Capesize/Panamax) or rail", icon: "ship", caution: "Never airlift for bulk coal" },
  gasoline: { mode: "Product tanker or pipeline", icon: "ship" },
  diesel: { mode: "Product tanker or pipeline", icon: "ship" },
  heating_oil: { mode: "Product tanker, rail, or truck", icon: "truck" },
  propane: { mode: "Pressurized LPG carrier or rail", icon: "train" },
  uranium: { mode: "Specialized containerized cargo", icon: "truck", caution: "Nuclear security protocols apply" },
};

function getTransportIcon(iconName: string) {
  switch (iconName) {
    case "ship": return <Ship className="size-3.5" />;
    case "train": return <Train className="size-3.5" />;
    case "truck": return <Truck className="size-3.5" />;
    default: return <Ship className="size-3.5" />;
  }
}

const ENERGY_COLORS: Record<string, string> = {
  crude_oil: "bg-white/[0.03] border-amber-500/10",
  brent_crude_oil: "bg-white/[0.03] border-sky-500/10",
  natural_gas: "bg-white/[0.03] border-blue-500/10",
  heating_oil: "bg-white/[0.03] border-orange-500/10",
  gasoline_rbob: "bg-white/[0.03] border-yellow-500/10",
  lng: "bg-white/[0.03] border-cyan-500/10",
  coal: "bg-white/[0.03] border-zinc-400/10",
  propane: "bg-white/[0.03] border-violet-500/10",
  ethanol: "bg-white/[0.03] border-teal-500/10",
  diesel: "bg-white/[0.03] border-red-500/10",
  jet_fuel: "bg-white/[0.03] border-pink-500/10",
  uranium: "bg-white/[0.03] border-emerald-500/10",
};

const ENERGY_COMMODITY_META: Record<string, { label: string; unit: string; icon: string }> = {
  crude_oil: { label: "Crude Oil (WTI)", unit: "bbl", icon: "flame" },
  brent_crude_oil: { label: "Brent Crude Oil", unit: "bbl", icon: "flame" },
  natural_gas: { label: "Natural Gas (HH)", unit: "MMBtu", icon: "flame" },
  heating_oil: { label: "Heating Oil", unit: "gal", icon: "droplets" },
  gasoline_rbob: { label: "Gasoline (RBOB)", unit: "gal", icon: "thermometer" },
  lng: { label: "LNG", unit: "MMBtu", icon: "zap" },
  coal: { label: "Coal", unit: "ton", icon: "hexagon" },
  propane: { label: "Propane", unit: "gal", icon: "droplets" },
  ethanol: { label: "Ethanol", unit: "gal", icon: "droplets" },
  diesel: { label: "Diesel", unit: "gal", icon: "thermometer" },
  jet_fuel: { label: "Jet Fuel", unit: "gal", icon: "thermometer" },
  uranium: { label: "Uranium", unit: "lb", icon: "zap" },
};

const ENERGY_SERIES_LIST = [
  { key: "brent", label: "Brent Crude" },
  { key: "wti", label: "WTI Crude" },
  { key: "natural_gas", label: "Natural Gas" },
  { key: "heating_oil", label: "Heating Oil" },
];

function getIcon(iconName: string) {
  switch (iconName) {
    case "flame": return <Flame className="size-3.5" />;
    case "droplets": return <Droplets className="size-3.5" />;
    case "thermometer": return <Thermometer className="size-3.5" />;
    case "zap": return <Zap className="size-3.5" />;
    case "hexagon": return <Hexagon className="size-3.5" />;
    default: return <Zap className="size-3.5" />;
  }
}

function fmtPrice(p: number | undefined | null, unit?: string): string {
  if (p == null || isNaN(p)) return "\u2014";
  return `$${p.toFixed(2)}${unit ? ` /${unit}` : ""}`;
}

function cls(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ProcurementPage() {
  const [data, setData] = useState<ProcurementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commodities, setCommodities] = useState<CommodityItem[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commError, setCommError] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("brent_crude_oil");
  const [selectedSeries, setSelectedSeries] = useState<string>("brent");
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(false);

  // Crisis Replay state
  const REPLAY_DATES = ["2026-02-28", "2026-03-10", "2026-03-25", "2026-04-15", "2026-05-01", "2026-06-10"];
  const [selectedReplayDate, setSelectedReplayDate] = useState<string | null>(null);
  const [replaySnapshot, setReplaySnapshot] = useState<ReplaySnapshot | null>(null);
  const [replayLoading, setReplayLoading] = useState(false);

  useEffect(() => {
    if (!selectedReplayDate) { setReplaySnapshot(null); return; }
    let cancelled = false;
    setReplayLoading(true);
    fetch(`/api/procurement/replay/${selectedReplayDate}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setReplaySnapshot(data); setReplayLoading(false); } })
      .catch(() => { if (!cancelled) setReplayLoading(false); });
    return () => { cancelled = true; };
  }, [selectedReplayDate]);

  const loadForecast = useCallback(async () => {
    try {
      const res = await fetch("/api/procurement/price-history");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setForecast(json.forecast ?? []);
    } catch {
      // silently skip
    }
  }, []);

  const loadCommodities = useCallback(async (force = false) => {
    setCommLoading(true);
    setCommError(false);
    try {
      const url = force ? "/api/procurement/live-price?force=true" : "/api/procurement/live-price";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.commodities) && json.commodities.length > 0) {
          setCommodities(json.commodities);
          return;
        }
      }
      setCommError(true);
    } catch {
      setCommError(true);
    } finally {
      setCommLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    setForceRefresh(true);
    setFetchTrigger((n) => n + 1);
    loadCommodities(true);
  }, [loadCommodities]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const url = forceRefresh ? "/api/procurement?force=true" : "/api/procurement";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = (await res.json()) as ProcurementData | { error: string };
        if (!cancelled) {
          if ("error" in json) {
            setError(json.error);
            setData(null);
          } else {
            setData(json);
          }
        }
      } catch {
        if (!cancelled) setError("Could not load procurement data. Check the server logs.");
      } finally {
        if (!cancelled) setLoading(false);
        setForceRefresh(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchTrigger, forceRefresh]);

  useEffect(() => { loadForecast(); loadCommodities(); }, [loadForecast, loadCommodities]);

  useEffect(() => {
    const id = setInterval(loadCommodities, 30000);
    return () => clearInterval(id);
  }, [loadCommodities]);

  const selectedItem = commodities.find((c) => c.value === selectedCommodity);

  // Find the last index where actual data exists so the two lines share a common anchor point
  const lastActualIdx = (() => {
    for (let i = forecast.length - 1; i >= 0; i--) {
      if (forecast[i][selectedSeries as keyof ForecastPoint] != null) return i;
    }
    return -1;
  })();

  const chartData = forecast.map((p, i) => {
    const predVal = p[`${selectedSeries}_predicted` as keyof ForecastPoint] as number | undefined;
    const ema8Val = p[`${selectedSeries}_ema8` as keyof ForecastPoint] as number | undefined;
    const ema21Val = p[`${selectedSeries}_ema21` as keyof ForecastPoint] as number | undefined;
    return {
      date: p.date,
      actual: p[selectedSeries as keyof ForecastPoint] as number | undefined,
      trendFit: i <= lastActualIdx ? predVal : undefined,
      predicted: i >= lastActualIdx ? predVal : undefined,
      ema8: i <= lastActualIdx ? ema8Val : undefined,
      ema21: i <= lastActualIdx ? ema21Val : undefined,
    };
  });

  const seriesMeta = ENERGY_SERIES_LIST.find((s) => s.key === selectedSeries);

  const comparisonData = forecast.length > 0
    ? ENERGY_SERIES_LIST.filter((s) => {
        const values = forecast.map((p) => p[s.key as keyof ForecastPoint]).filter((v): v is number => v != null);
        return values.length > 5;
      }).map((s) => {
        const values = forecast.map((p) => p[s.key as keyof ForecastPoint] as number | undefined).filter((v): v is number => v != null);
        const current = values[values.length - 1] ?? 0;
        const prev = values[0] ?? 0;
        return { name: s.label, current, change: prev ? ((current - prev) / prev) * 100 : 0 };
      })
    : [];

  const importData = [
    {
      name: "Crude Oil",
      pct: 87,
      fill: "#f59e0b",
      topSources: ["Iraq (22%)", "Saudi Arabia (18%)", "UAE (12%)", "Russia (10%)", "Kuwait (7%)"],
      risk: "High",
      riskDetail: "80%+ imported; Strait of Hormuz chokepoint; OPEC+ supply cuts directly impact costs",
      impact: "Every $10/bbl rise widens current account deficit by ~$15B annually",
    },
    {
      name: "LNG",
      pct: 55,
      fill: "#06b6d4",
      topSources: ["Qatar (42%)", "USA (18%)", "Australia (12%)", "Russia (8%)"],
      risk: "Medium-High",
      riskDetail: "Qatar dominance creates single-source risk; long-term contracts limit flexibility",
      impact: "Spot LNG price spikes can raise power generation costs 20-30% in peak demand",
    },
    {
      name: "Natural Gas",
      pct: 50,
      fill: "#3b82f6",
      topSources: ["Qatar (pipeline + LNG)", "Domestic production (~40%)", "Myanmar pipeline"],
      risk: "Medium",
      riskDetail: "Domestic output covers ~40%; pipeline imports from limited corridors",
      impact: "Gas-dependent fertilizer & power sectors face input cost volatility",
    },
    {
      name: "Coal",
      pct: 25,
      fill: "#71717a",
      topSources: ["Indonesia (50%)", "Australia (20%)", "South Africa (10%)", "Russia (8%)"],
      risk: "Low-Medium",
      riskDetail: "Domestic production significant; Indonesia provides diversified supply",
      impact: "Imported coking coal critical for steel; thermal coal largely domestic",
    },
  ];

  return (
    <div className="space-y-4 p-6 bg-background">
      <style dangerouslySetInnerHTML={{ __html: lineDrawCSS }} />
      <div className="glass-surface flex items-center justify-between rounded-xl border border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <Package aria-hidden className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest">
              Energy Procurement &amp; Sourcing Intelligence
            </p>
            <p className="mt-1 numeric text-xs text-muted-foreground">
              For import-dependent economies
              {data ? ` \u00B7 Generated at ${new Date(data.generated_at).toLocaleTimeString()}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-foreground/90 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw aria-hidden className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !data && (
        <div className="glass-surface rounded-xl border border-white/10 p-5 text-sm text-muted-foreground">
          Generating energy procurement briefing from latest news...
        </div>
      )}

      {loading && data && (
        <div className="glass-surface rounded-xl border border-white/10 px-5 py-2.5 text-xs text-muted-foreground">
          Updating with latest energy news...
        </div>
      )}

      {error && (
        <div className="glass-surface rounded-xl border border-red-500/20 p-5 text-sm text-red-400">
          {error}
        </div>
      )}

      {data?.fallback && (
        <div className="glass-surface rounded-xl border border-amber-500/20 px-5 py-3 text-xs text-amber-400/90">
          Showing cached sample briefing — LLM unavailable. Live AI generation will resume automatically.
        </div>
      )}

      {/* ====== Import Dependency Overview ====== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {importData.map((item) => {
          const riskColor = item.risk === "High" ? "text-red-400" : item.risk === "Medium-High" ? "text-orange-400" : item.risk === "Medium" ? "text-amber-400" : "text-emerald-400";
          return (
            <div key={item.name} className="glass-surface rounded-xl border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.name}</p>
                <span className={`text-[9px] font-semibold ${riskColor}`}>{item.risk}</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground numeric">{item.pct}%</p>
              <p className="text-[10px] text-muted-foreground/50">Import Dependency</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70 leading-snug">{item.impact}</p>
            </div>
          );
        })}
      </div>

      {/* ====== Live Energy Commodity Prices ====== */}
      {commodities.length > 0 && (
        <div className="glass-surface rounded-xl border border-white/10 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 aria-hidden className="size-4 text-primary" />
              <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                Live Energy Commodity Prices
              </p>
              <ProvenanceBadge kind="live" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {commodities.map((item) => {
              const isSel = selectedCommodity === item.value;
              const gradient = ENERGY_COLORS[item.value] ?? "bg-white/[0.03] border-white/10";
              const meta = ENERGY_COMMODITY_META[item.value];
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setSelectedCommodity(item.value);
                    const seriesMap: Record<string, string> = {
                      brent_crude_oil: "brent", crude_oil: "wti",
                      natural_gas: "natural_gas", heating_oil: "heating_oil",
                    };
                    if (seriesMap[item.value]) setSelectedSeries(seriesMap[item.value]);
                  }}
                  className={cls(
                    "relative overflow-hidden rounded-lg border backdrop-blur-md p-3 text-left transition-all",
                    gradient,
                    isSel ? "ring-1 ring-primary/30 border-white/15" : "hover:border-white/15",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {meta && getIcon(meta.icon)}
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.name}</p>
                  </div>
                  <p className="mt-0.5 text-base font-bold text-foreground numeric">{fmtPrice(item.price, "")}</p>
                  <p className="text-[9px] text-muted-foreground/50">
                    {item.unit || "USD"} {item.exchange !== "Unknown" ? ` \u00B7 ${item.exchange}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
          {commError && commodities.length === 0 && (
            <p className="mt-3 text-[10px] text-muted-foreground/50">
              Energy prices may be delayed. Free API tier rotates commodities.
            </p>
          )}
        </div>
      )}

      {/* ====== Energy Price Comparison Chart ====== */}
      {comparisonData.length > 1 && (
        <div className="glass-surface rounded-xl border border-white/10 p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">
              Energy commodity price change (30-day)
            </p>
            <ProvenanceBadge kind="historical" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,28,40,0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#f0f4f8",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  formatter={(value: any) => [`${typeof value === "number" ? (value > 0 ? "+" : "") + value.toFixed(2) : "0"}%`, "30-day Change"]}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                <Bar
                  dataKey="change"
                  radius={[6, 6, 0, 0]}
                  label={({ x, y, width, value }: any) => (
                    <text
                      x={x + width / 2}
                      y={value >= 0 ? y - 8 : y + 16}
                      fill={value >= 0 ? "#34d399" : "#f87171"}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      className="numeric"
                    >
                      {value > 0 ? "+" : ""}{Number(value).toFixed(1)}%
                    </text>
                  )}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.change >= 0 ? "url(#barGradPos)" : "url(#barGradNeg)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ====== Import Dependency Chart & Country Breakdown ====== */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">
            Import Dependency by Energy Commodity
          </p>
          <ProvenanceBadge kind="static" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left: Horizontal Bar Chart */}
          <div className="lg:w-1/2">
            <p className="mb-3 text-[11px] text-muted-foreground/60">
              India imports % of each energy commodity it consumes. Higher bars = greater exposure to global supply shocks.
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Import Dependency"]}
                    contentStyle={{ background: "#0f1c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#f0f4f8" }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={28}>
                    {importData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Detailed Country Breakdown */}
          <div className="space-y-4 lg:w-1/2 lg:pl-6 lg:border-l lg:border-white/5">
            {importData.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs font-semibold text-foreground">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground/50">|</span>
                  <span className="text-[10px] text-muted-foreground/70">{item.pct}% imported</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 leading-relaxed pl-5">
                  {item.riskDetail}
                </p>
                <div className="flex flex-wrap gap-1.5 pl-5">
                  {item.topSources.map((src) => (
                    <span key={src} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-foreground/60 border border-white/5">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 mt-2">
              <p className="text-[11px] text-foreground/70 leading-relaxed">
                <span className="font-semibold text-foreground/80">Why this matters:</span> India is the world's 3rd largest energy consumer.
                87% crude oil import dependence means global price shocks directly hit the rupee, inflation, and fiscal deficit.
                The Strait of Hormuz — through which 20M+ bbl/day transits — is a critical chokepoint; any disruption there
                would immediately spike Indian fuel and input costs across manufacturing, transport, and agriculture.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Price History & Forecast Chart ====== */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">
              30-day price history &amp; forecast
            </p>
            <ProvenanceBadge kind="historical" />
          </div>
          <div className="flex gap-1">
            {ENERGY_SERIES_LIST.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSelectedSeries(s.key)}
                className={cls(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  selectedSeries === s.key ? "bg-sky-500/20 text-sky-400" : "text-muted-foreground hover:text-foreground",
                )}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {chartData.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-sky-400" />
                Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-emerald-400" />
                EMA 8
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-violet-400" />
                EMA 21
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm border-2 border-dashed border-sky-400 bg-transparent" />
                Trend
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm border-2 border-dashed border-amber-400 bg-transparent" />
                Forecast
              </span>
              <span className="flex items-center gap-1 numeric">
                <TrendingUp className="size-3 text-emerald-400" />
                Last: {fmtPrice(chartData.filter((d) => d.actual != null).pop()?.actual)}
              </span>
              <span className="flex items-center gap-1 numeric">
                <TrendingDown className="size-3 text-orange-400" />
                Forecast: {fmtPrice(chartData.filter((d) => d.predicted != null).pop()?.predicted)}
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                    tickFormatter={(d) => { const dt = new Date(d); return `${dt.getMonth() + 1}/${dt.getDate()}`; }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0f1c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#f0f4f8" }}
                    labelStyle={{ color: "#f0f4f8", fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: any, name: any) => {
                      if (typeof value !== "number") return [value, name];
                      if (name === "actual") return [`$${value.toFixed(2)}`, "Actual"];
                      if (name === "ema8") return [`$${value.toFixed(2)}`, "EMA 8"];
                      if (name === "ema21") return [`$${value.toFixed(2)}`, "EMA 21"];
                      if (name === "trendFit") return [`$${value.toFixed(2)}`, "Trend"];
                      if (name === "predicted") return [`$${value.toFixed(2)}`, "Forecast"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      if (!label) return "";
                      return new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    }}
                  />
                  <defs>
                    <linearGradient id="actualGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="70%" stopColor="#38bdf8" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="forecastGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="60%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glowStrong">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Line type="monotone" dataKey="actual" name="actual" stroke="url(#actualGlow)" strokeWidth={2.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="ema8" name="ema8" stroke="#34d399" strokeWidth={1.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="ema21" name="ema21" stroke="#a78bfa" strokeWidth={1.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="trendFit" name="trendFit" stroke="#38bdf8" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    name="predicted"
                    stroke="url(#forecastGlow)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={(props: any) => {
                      const { cx, cy, index, payload } = props;
                      if (index !== chartData.length - 1) return null;
                      if (cx == null || cy == null) return null;

                      const prevPoint = chartData[chartData.length - 2];
                      const lastPoint = chartData[chartData.length - 1];
                      const prevY = prevPoint?.predicted ?? lastPoint?.actual ?? cy;
                      const goingUp = cy < prevY;

                      return (
                        <g filter="url(#glowStrong)">
                          {/* Pulse ring */}
                          <circle cx={cx} cy={cy} r={10} fill="none" stroke="#f59e0b" strokeWidth={1.5} opacity={0.3}>
                            <animate attributeName="r" values="6;14;6" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
                          </circle>
                          {/* Outer glow */}
                          <circle cx={cx} cy={cy} r={6} fill="#f59e0b" opacity={0.2} />
                          {/* Core dot */}
                          <circle cx={cx} cy={cy} r={3.5} fill="#f59e0b" stroke="#fef3c7" strokeWidth={1} />
                          {/* Directional arrow */}
                          <g transform={`translate(${cx + 10}, ${cy})`}>
                            <g transform={goingUp ? "rotate(-90)" : "rotate(90)"}>
                              <path d="M0,-5 L5,0 L0,5" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
                              <line x1={-1} y1={0} x2={-7} y2={0} stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
                            </g>
                          </g>
                        </g>
                      );
                    }}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground/50">
              Source: Yahoo Finance daily closing prices. Forecast: Holt-Winters exponential smoothing with weekly seasonality and mean reversion. Energy commodities: Crude Oil (Brent, WTI), Natural Gas, Heating Oil.
            </p>
          </>
        )}

            {chartData.length === 0 && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            {commLoading ? "Loading price data..." : "Loading forecast data from Yahoo Finance..."}
          </div>
        )}
      </div>

      {/* ====== Energy Sourcing Options ====== */}
      {data && (
        <>
          <div className="glass-surface rounded-xl border border-white/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText aria-hidden className="size-4 text-muted-foreground" />
              <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                Executive summary
              </p>
              <ProvenanceBadge kind="ai-estimate" />
            </div>
            <p className="text-base leading-relaxed text-foreground/90">
              {data.executive_summary}
            </p>
            <p className="mt-2 text-[10px] text-sky-400/70">
              Corroborated by Geopolitical Risk module
            </p>
          </div>

          {data.historical_comparison && (
            <div className="glass-surface rounded-xl border border-white/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                  Historical energy disruption pattern match
                </p>
                <ProvenanceBadge kind="ai-estimate" />
              </div>
              <p className="text-base leading-relaxed text-foreground/90">
                {data.historical_comparison}
              </p>
            </div>
          )}

          {data.alternatives.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                  Energy sourcing options — diversification recommendations
                </p>
                <ProvenanceBadge kind="ai-estimate" />
              </div>
              {data.alternatives.map((item) => (
                <div
                  key={item.option_number}
                  className="glass-surface rounded-xl border border-white/10 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        Option {item.option_number} — {item.source}
                      </p>
                      <span className="mt-1 inline-block rounded-md border border-foreground/10 bg-foreground/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {item.commodity}
                      </span>
                      {(() => {
                        const t = COMMODITY_TRANSPORT[item.commodity];
                        return t ? (
                          <span className="ml-1.5 inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground/70">
                            {getTransportIcon(t.icon)}
                            {t.mode}
                            {t.caution ? <span className="ml-1 text-orange-400/70">· {t.caution}</span> : null}
                          </span>
                        ) : null;
                      })()}
                      <p className="mt-2 text-base font-medium text-foreground/95">
                        {item.summary}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-base text-foreground/80">
                        {item.detail.map((point, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-foreground/30">·</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      {item.compatibility && (
                        <p className="mt-4 text-sm">
                          <span className="font-bold text-foreground">Compatibility: </span>
                          <span className="text-foreground/80">{item.compatibility}</span>
                        </p>
                      )}
                      <p className="mt-4 mb-1.5 text-sm font-bold text-foreground">
                        Diplomatic perspective
                      </p>
                      <ul className="space-y-1.5 text-base text-foreground/80">
                        {item.diplomatic_perspective.map((point, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-foreground/30">·</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      {item.source_article && (
                        <a
                          href={item.source_article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-sky-400 hover:underline"
                        >
                          Source: {item.source_article.title}
                        </a>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide ${TIER_STYLES[item.tier]}`}
                    >
                      {TIER_LABEL[item.tier]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="px-1 text-xs text-muted-foreground/70">
            {data.disclaimer}
          </p>
          <p className="px-1 mt-1 text-[10px] text-muted-foreground/50">
            This briefing supports decision-making but does not replace formal risk assessment. Diplomatic/strategic assessments are directional, not official policy positions.
          </p>
        </>
      )}

      {/* ====== Crisis Replay Mode ====== */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock aria-hidden className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">
            Historical replay — &nbsp;Hormuz Crisis (Feb–Jun 2026)
          </p>
          <ProvenanceBadge kind="historical" />
        </div>
        <p className="mb-4 text-xs text-muted-foreground/70 leading-relaxed">
          Historical replay — recommendations generated using only information available as of each date, tested against real documented outcomes.
        </p>

        {/* Timeline scrubber */}
        <div className="relative mb-6">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2" />
          <div className="relative flex justify-between">
            {REPLAY_DATES.map((d) => {
              const label = new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const isSelected = selectedReplayDate === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedReplayDate(isSelected ? null : d)}
                  className={cls(
                    "relative z-10 flex flex-col items-center gap-1 rounded-full px-3 py-2 text-[11px] font-medium transition-all",
                    isSelected
                      ? "bg-sky-500/20 text-sky-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  <span className={cls(
                    "inline-block size-3 rounded-full border-2 transition-all",
                    isSelected ? "border-sky-400 bg-sky-400" : "border-white/20 bg-transparent",
                  )} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {replayLoading && (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            Loading replay snapshot...
          </div>
        )}

        {replaySnapshot && !replayLoading && (
          <div className="space-y-4">
            {/* Calibration Warning Label */}
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[11px] text-amber-400/90">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              <span>
                <strong className="text-amber-400">Validated calibration snapshot</strong> — documented historical outcome used to anchor predictive models, not a live simulation run.
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  System recommendation as of {new Date(replaySnapshot.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                <ProvenanceBadge kind="ai-estimate" />
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {replaySnapshot.system_recommendation.executive_summary}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground/70">Top option:</span>
                <span className="text-xs font-medium text-foreground/90">{replaySnapshot.system_recommendation.top_option}</span>
                <span className={cls(
                  "rounded-md border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide",
                  replaySnapshot.system_recommendation.tier === "recommended" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "",
                  replaySnapshot.system_recommendation.tier === "viable" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "",
                  replaySnapshot.system_recommendation.tier === "caution" ? "border-orange-500/30 bg-orange-500/10 text-orange-400" : "",
                )}>
                  {replaySnapshot.system_recommendation.tier.toUpperCase()}
                </span>
              </div>
              <p className="mt-2 text-[10px] italic text-muted-foreground/40">
                {replaySnapshot.news_context_note}
              </p>
            </div>

            {/* Actual outcome card */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Actual outcome
                </p>
                <ProvenanceBadge kind="historical" />
              </div>
              <div className="mb-2 space-y-0.5">
                <p className="text-[11px] text-foreground/70">
                  Brent: {replaySnapshot.actual_outcome.real_price_brent != null ? `$${replaySnapshot.actual_outcome.real_price_brent.toFixed(2)}` : "Price data unavailable for this date"}
                </p>
                <p className="text-[11px] text-foreground/70">
                  WTI: {replaySnapshot.actual_outcome.real_price_wti != null ? `$${replaySnapshot.actual_outcome.real_price_wti.toFixed(2)}` : "Price data unavailable for this date"}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-foreground/80">
                {replaySnapshot.actual_outcome.documented_response}
              </p>
              {replaySnapshot.actual_outcome.source_url && (
                <a href={replaySnapshot.actual_outcome.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[10px] text-sky-400 hover:underline">
                  Source
                </a>
              )}
              {replaySnapshot.lead_time_days != null && (
                <p className="mt-2 text-[11px] text-amber-400/80">
                  Lead time: {replaySnapshot.lead_time_days} days
                </p>
              )}
            </div>
          </div>
        </div>
        )}

        {!selectedReplayDate && !replayLoading && (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground/50">
            Select a checkpoint date above to view the system's recommendation and the actual outcome at that point in the crisis.
          </div>
        )}
      </div>
    </div>
  );
}