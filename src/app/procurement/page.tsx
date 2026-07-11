"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Package, FileText, RefreshCw, TrendingUp, TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
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
  tier: RankTier;
  summary: string;
  detail: string[];
  refinery_compatibility: string;
  diplomatic_perspective: string[];
  source_article: { title: string; url: string } | null;
};

type CriticalCargo = {
  item: string;
  detail: string;
  mode: string;
  eta: string;
} | null;

type CommodityItem = {
  exchange: string; name: string; value: string; category: string;
  price: number; updated: number; currency_unit: string; unit: string;
};

type ForecastPoint = {
  date: string; brent?: number; wti?: number;
  brent_predicted?: number; wti_predicted?: number;
};

type ProcurementData = {
  generated_at: string;
  executive_summary: string;
  historical_comparison: string;
  alternatives: Alternative[];
  critical_cargo: CriticalCargo;
  disclaimer: string;
  fallback?: boolean;
};

const CATEGORY_LABEL: Record<string, string> = {
  energy: "Energy", precious_metals: "Precious Metals", base_metals: "Base Metals",
  grains: "Grains", softs: "Softs", livestock: "Livestock",
};

const CARD_COLORS: Record<string, string> = {
  crude_oil: "from-amber-500/20 to-amber-600/10 border-amber-500/20",
  brent_crude_oil: "from-sky-500/20 to-sky-600/10 border-sky-500/20",
  natural_gas: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
  gold: "from-yellow-400/20 to-yellow-500/10 border-yellow-400/20",
  silver: "from-slate-300/20 to-slate-400/10 border-slate-300/20",
  copper: "from-rose-500/20 to-rose-600/10 border-rose-500/20",
  corn: "from-amber-300/20 to-amber-400/10 border-amber-300/20",
  wheat: "from-yellow-200/20 to-yellow-300/10 border-yellow-200/20",
  soybean: "from-green-500/20 to-green-600/10 border-green-500/20",
};

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
  const [selected, setSelected] = useState<string>("brent_crude_oil");
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

  const selectedItem = commodities.find((c) => c.value === selected);
  const isOil = selected === "brent_crude_oil" || selected === "crude_oil";
  const chartKey = selected === "brent_crude_oil" ? "brent" : selected === "crude_oil" ? "wti" : null;

  const chartData = forecast.map((p) => ({
    date: p.date,
    actual: chartKey === "brent" ? p.brent : chartKey === "wti" ? p.wti : undefined,
    pred: chartKey === "brent" ? p.brent_predicted : chartKey === "wti" ? p.wti_predicted : undefined,
  }));

  const categories = [...new Set(commodities.map((c) => c.category).filter(Boolean))];

  return (
    <div className="space-y-4 p-6">
      <div className="glass-surface flex items-center justify-between rounded-xl border border-white/10 p-5">
        <div className="flex items-center gap-3">
          <Package aria-hidden className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest">
              Procurement &amp; Sourcing Intelligence
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data
                ? `Generated ${new Date(data.generated_at).toLocaleTimeString()}`
                : "Loading..."}
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
          Generating briefing from latest news...
        </div>
      )}

      {loading && data && (
        <div className="glass-surface rounded-xl border border-white/10 px-5 py-2.5 text-xs text-muted-foreground">
          Updating with latest news...
        </div>
      )}

      {error && (
        <div className="glass-surface rounded-xl border border-red-500/20 p-5 text-sm text-red-400">
          {error}
        </div>
      )}

      {data?.fallback && (
        <div className="glass-surface rounded-xl border border-amber-500/20 px-5 py-3 text-xs text-amber-400/90">
          Showing cached sample briefing — Groq rate limit reached or API unavailable. Live AI generation will resume automatically when quota resets.
        </div>
      )}

      {/* ====== Live Commodity Prices ====== */}
      {commodities.length > 0 && (
        <div className="glass-surface rounded-xl border border-white/10 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">
              Live commodity prices
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelected("")}
                className={cls(
                  "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                  !selected ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >All</button>
              {categories.map((cat) => (
                <span key={cat} className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground">
                  {CATEGORY_LABEL[cat] ?? cat}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {commodities.map((item) => {
              const isSel = selected === item.value;
              const gradient = CARD_COLORS[item.value] ?? "from-white/5 to-white/0 border-white/5";
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelected(item.value)}
                  className={cls(
                    "relative overflow-hidden rounded-lg border bg-gradient-to-br p-3 text-left transition-all",
                    gradient,
                    isSel ? "ring-1 ring-primary/30" : "hover:border-white/20",
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.name}</p>
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
              Prices may be delayed. Free API tier rotates commodities.
            </p>
          )}
        </div>
      )}

      {/* ====== Single Chart / Price Card ====== */}
      <div className="glass-surface rounded-xl border border-white/10 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">
              {isOil ? "30-day price history &amp; forecast" : "Current price"}
            </p>
          </div>
          {isOil && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSelected("brent_crude_oil")}
                className={cls(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  selected === "brent_crude_oil" ? "bg-sky-500/20 text-sky-400" : "text-muted-foreground hover:text-foreground",
                )}
              >Brent</button>
              <button
                type="button"
                onClick={() => setSelected("crude_oil")}
                className={cls(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  selected === "crude_oil" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:text-foreground",
                )}
              >WTI</button>
            </div>
          )}
        </div>

        {!isOil && selectedItem && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] py-10">
            <p className="text-4xl font-bold text-foreground">{fmtPrice(selectedItem.price)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{selectedItem.name}</p>
            <p className="text-xs text-muted-foreground/60">{selectedItem.exchange} \u00B7 {selectedItem.unit || "USD"}</p>
            <div className="mt-6 max-w-md rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center text-xs text-amber-400/80">
              No historical chart available for this commodity. The only free API with 30-day price history
              is the U.S. EIA, which covers crude oil (Brent &amp; WTI) only.
              Select <strong>Brent</strong> or <strong>WTI</strong> above to see the full forecast chart.
            </div>
          </div>
        )}

        {!isOil && !selectedItem && selected && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Price data not available for this commodity from the current API feed.
          </div>
        )}

        {isOil && chartData.length > 0 && (
          <>
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm bg-sky-400" />
                Actual ({selectedItem?.name ?? (chartKey === "brent" ? "Brent" : "WTI")})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm border-2 border-dashed border-sky-400 bg-transparent" />
                Predicted (linear regression)
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="size-3 text-emerald-400" />
                Last: {fmtPrice(chartData.filter(d => d.actual != null).pop()?.actual)}
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="size-3 text-orange-400" />
                Forecast: {fmtPrice(chartData.filter(d => d.pred != null).pop()?.pred)}
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
              Source: EIA daily spot prices (last 30 days). Forecast: linear regression over the 30-day window.
            </p>
          </>
        )}

        {isOil && chartData.length === 0 && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            {commLoading ? "Loading price data..." : "Loading forecast data from EIA..."}
          </div>
        )}
      </div>

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
                Historical pattern match
              </p>
              <p className="text-base leading-relaxed text-foreground/90">
                {data.historical_comparison}
              </p>
            </div>
          )}

          {data.alternatives.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-sm font-bold uppercase tracking-widest text-foreground">
                Sourcing options — bulk crude oil
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
                      <p className="mt-4 text-sm">
                        <span className="font-bold text-foreground">Refinery compatibility: </span>
                        <span className="text-foreground/80">{item.refinery_compatibility}</span>
                      </p>
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

          {data.critical_cargo && (
            <div className="glass-surface rounded-xl border border-white/10 p-5">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-foreground">
                Critical / low-volume cargo — separate handling
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-foreground">{data.critical_cargo.item}</p>
                  <p className="mt-2 text-sm text-foreground/80">
                    {data.critical_cargo.detail}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-sky-400">
                  {data.critical_cargo.mode.toUpperCase()} · {data.critical_cargo.eta}
                </span>
              </div>
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