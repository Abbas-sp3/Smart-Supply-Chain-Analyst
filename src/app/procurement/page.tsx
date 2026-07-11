"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, FileText, RefreshCw } from "lucide-react";

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

type ProcurementData = {
  generated_at: string;
  executive_summary: string;
  historical_comparison: string;
  alternatives: Alternative[];
  critical_cargo: CriticalCargo;
  disclaimer: string;
  fallback?: boolean;
};

export default function ProcurementPage() {
  const [data, setData] = useState<ProcurementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fetchTrigger, setFetchTrigger] = useState(0);

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