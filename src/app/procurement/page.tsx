"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Package, FileText, RefreshCw, TrendingUp, TrendingDown,
  BarChart3, Zap, Flame, Thermometer, Droplets, Hexagon,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

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
};

type ProcurementData = {
  generated_at: string;
  executive_summary: string;
  historical_comparison: string;
  alternatives: Alternative[];
  disclaimer: string;
  fallback?: boolean;
};

const ENERGY_COLORS: Record<string, string> = {
  crude_oil: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
  brent_crude_oil: "from-sky-500/20 to-sky-600/10 border-sky-500/20",
  natural_gas: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
  heating_oil: "from-orange-500/20 to-orange-600/10 border-orange-500/20",
  gasoline_rbob: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/20",
  lng: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20",
  coal: "from-zinc-500/20 to-zinc-600/10 border-zinc-500/20",
  propane: "from-violet-500/20 to-violet-600/10 border-violet-500/20",
  diesel: "from-red-500/20 to-red-600/10 border-red-500/20",
  uranium: "from-green-500/20 to-green-600/10 border-green-500/20",
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
  diesel: { label: "Diesel", unit: "gal", icon: "thermometer" },
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

  const loadCommodities = useCallback(async () => {
    setCommLoading(true);
    setCommError(false);
    try {
      const res = await fetch("/api/procurement/live-price");
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
    setFetchTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/procurement");
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
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchTrigger]);

  useEffect(() => { loadForecast(); loadCommodities(); }, [loadForecast, loadCommodities]);

  useEffect(() => {
    const id = setInterval(loadCommodities, 30000);
    return () => clearInterval(id);
  }, [loadCommodities]);

  const selectedItem = commodities.find((c) => c.value === selectedCommodity);

  const chartData = forecast.map((p) => ({
    date: p.date,
    actual: p[selectedSeries as keyof ForecastPoint] as number | undefined,
    pred: p[`${selectedSeries}_predicted` as keyof ForecastPoint] as number | undefined,
  }));

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
    { name: "Crude Oil", pct: 87, fill: "#f59e0b" },
    { name: "LNG", pct: 55, fill: "#06b6d4" },
    { name: "Coal", pct: 25, fill: "#71717a" },
    { name: "Natural Gas", pct: 50, fill: "#3b82f6" },
  ];

  return (
    <div className="space-y-4 p-6 bg-background">
      <div className="glass-surface flex items-center justify-between rounded-xl border border-white/10 p-5">
        <div className="flex items-center gap-3">
          <Package aria-hidden className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest">
              Energy Procurement &amp; Sourcing Intelligence
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              For import-dependent economies
              {data ? ` \u00B7 ${new Date(data.generated_at).toLocaleTimeString()}` : ""}
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
        {importData.map((item) => (
          <div key={item.name} className="glass-surface rounded-xl border border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.name}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{item.pct}%</p>
            <p className="text-[10px] text-muted-foreground/50">Import Dependency</p>
          </div>
        ))}
      </div>

      {/* ====== Live Energy Commodity Prices ====== */}
      {commodities.length > 0 && (
        <div className="glass-surface rounded-xl border border-white/10 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 aria-hidden className="size-4 text-primary" />
              <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                Live Energy Commodity Prices
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {commodities.map((item) => {
              const isSel = selectedCommodity === item.value;
              const gradient = ENERGY_COLORS[item.value] ?? "from-white/5 to-white/0 border-white/5";
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
                    "relative overflow-hidden rounded-lg border bg-gradient-to-br p-3 text-left transition-all",
                    gradient,
                    isSel ? "ring-1 ring-primary/30" : "hover:border-white/20",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {meta && getIcon(meta.icon)}
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.name}</p>
                  </div>
                  <p className="mt-0.5 text-base font-bold text-foreground">{fmtPrice(item.price, "")}</p>
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
        <div className="glass-surface rounded-xl border border-white/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">
              Energy commodity price change (30-day)
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ background: "#0f1c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#f0f4f8" }}
                  formatter={(value: any) => [`${typeof value === "number" ? value.toFixed(1) : "0"}%`, "Change"]}
                />
                <Bar dataKey="change" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ====== Import Dependency Pie Chart ====== */}
      <div className="glass-surface rounded-xl border border-white/10 p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">
            Import Dependency by Energy Commodity
          </p>
        </div>
        <div className="flex flex-col items-center md:flex-row">
          <div className="h-64 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={importData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="pct" nameKey="name" label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}%`}>
                  {importData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f1c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#f0f4f8" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3 md:mt-0 md:w-1/2 md:pl-6">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Import-dependent economies face significant exposure to global energy price volatility and supply disruptions. The chart shows estimated import dependency ratios for key energy commodities, highlighting the critical need for diversified sourcing strategies.
            </p>
            <div className="space-y-2">
              {importData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-foreground/70">{item.name}: {item.pct}% dependent on imports</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====== Price History & Forecast Chart ====== */}
      <div className="glass-surface rounded-xl border border-white/10 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">
              30-day price history &amp; forecast
            </p>
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
                Actual ({seriesMeta?.label ?? selectedSeries})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm border-2 border-dashed border-sky-400 bg-transparent" />
                Predicted (linear regression)
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="size-3 text-emerald-400" />
                Last: {fmtPrice(chartData.filter((d) => d.actual != null).pop()?.actual)}
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="size-3 text-orange-400" />
                Forecast: {fmtPrice(chartData.filter((d) => d.pred != null).pop()?.pred)}
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
                      if (name === "pred") return [`$${value.toFixed(2)}`, "Predicted"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      if (!label) return "";
                      return new Date(label).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    }}
                  />
                  <Line type="monotone" dataKey="actual" name="actual" stroke="#38bdf8" strokeWidth={2.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="pred" name="pred" stroke="#38bdf8" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground/50">
              Source: EIA daily spot prices (last 30 days). Forecast: linear regression over the 30-day window. Energy commodities: Crude Oil (Brent, WTI), Natural Gas (Henry Hub), Heating Oil.
            </p>
          </>
        )}

        {chartData.length === 0 && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            {commLoading ? "Loading price data..." : "Loading forecast data from EIA..."}
          </div>
        )}
      </div>

      {/* ====== Energy Sourcing Options ====== */}
      {data && (
        <>
          <div className="glass-surface rounded-xl border border-white/10 p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText aria-hidden className="size-4 text-muted-foreground" />
              <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                Executive summary
              </p>
            </div>
            <p className="text-base leading-relaxed text-foreground/90">
              {data.executive_summary}
            </p>
          </div>

          {data.historical_comparison && (
            <div className="glass-surface rounded-xl border border-white/10 p-5">
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-foreground">
                Historical energy disruption pattern match
              </p>
              <p className="text-base leading-relaxed text-foreground/90">
                {data.historical_comparison}
              </p>
            </div>
          )}

          {data.alternatives.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-sm font-bold uppercase tracking-widest text-foreground">
                Energy sourcing options — diversification recommendations
              </p>
              {data.alternatives.map((item) => (
                <div
                  key={item.option_number}
                  className="glass-surface rounded-xl border border-white/10 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        Option {item.option_number} — {item.source}
                      </p>
                      <span className="mt-1 inline-block rounded-md border border-foreground/10 bg-foreground/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {item.commodity}
                      </span>
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
        </>
      )}
    </div>
  );
}