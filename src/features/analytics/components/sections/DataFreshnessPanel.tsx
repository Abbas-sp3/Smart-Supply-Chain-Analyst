"use client";

import { Database, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type DataSourceEntry = {
  label: string;
  status: "live" | "cached" | "computed";
  detail: string;
  freshnessNote: string;
};

const DATA_SOURCES: DataSourceEntry[] = [
  {
    label: "AIS Vessel Monitoring",
    status: "live",
    detail: "OpenSky Network API",
    freshnessNote: "Polled on page load. Cached 5 min server-side.",
  },
  {
    label: "Geopolitical News",
    status: "live",
    detail: "NewsAPI (current affairs feed)",
    freshnessNote: "Fetched on Intelligence report generation. Cached 15 min.",
  },
  {
    label: "Commodity Prices",
    status: "live",
    detail: "Yahoo Finance (BZ=F, CL=F)",
    freshnessNote: "Fetched on Analytics load. 90-day historical close prices.",
  },
  {
    label: "Scenario Engine",
    status: "computed",
    detail: "Propagation Engine — deterministic BFS",
    freshnessNote: "Computed in-browser on page render. No caching.",
  },
  {
    label: "Procurement Rankings",
    status: "cached",
    detail: "Static alternative sources dataset (Platts/Argus 2024 avg.)",
    freshnessNote: "Static dataset last calibrated: FY2024 averages.",
  },
  {
    label: "SPR Optimization",
    status: "computed",
    detail: "Optimization Engine — INDIA_RESERVE_CONFIG",
    freshnessNote: "Computed in-browser. Reserve parameters are illustrative.",
  },
  {
    label: "Knowledge Graph",
    status: "cached",
    detail: "India Trade Knowledge Graph — embedded constants",
    freshnessNote: "Static graph. Calibrated from EIA / UNCTAD 2024-25 data.",
  },
];

const STATUS_CONFIG = {
  live: { dot: "bg-emerald-400 animate-pulse", label: "LIVE", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
  cached: { dot: "bg-amber-400", label: "STATIC", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
  computed: { dot: "bg-sky-400", label: "COMPUTED", color: "text-sky-400 border-sky-500/20 bg-sky-500/5" },
};

export function DataFreshnessPanel() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-zinc-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Data Freshness
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/50">
          Page loaded at {timeStr} IST
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {DATA_SOURCES.map((src) => {
          const cfg = STATUS_CONFIG[src.status];
          return (
            <div
              key={src.label}
              className={`rounded-lg border p-2.5 ${cfg.color}`}
              title={src.freshnessNote}
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                <span className={`text-[9px] font-bold uppercase tracking-wider`}>{cfg.label}</span>
              </div>
              <p className="text-[10px] font-semibold text-foreground/80 leading-snug">{src.label}</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground/50 leading-snug">{src.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
