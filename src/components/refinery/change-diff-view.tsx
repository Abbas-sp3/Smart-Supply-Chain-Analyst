"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

type DiffEntry = {
  field: string;
  previous: string;
  current: string;
  changeType: "improved" | "degraded" | "new" | "removed";
};

type Snapshot = {
  id: string;
  timestamp: string;
  source: string;
  diffs: DiffEntry[];
};

export function ChangeDiffView() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/change-diff");
        if (res.ok) {
          const json = await res.json();
          setSnapshots(json.snapshots ?? []);
        }
      } catch { /* keep empty */ } finally {
        setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-muted-foreground">
        Loading change history...
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center">
        <Clock className="size-4 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-[11px] text-muted-foreground/50">
          No previous snapshots yet. Changes will appear after the next data refresh.
        </p>
      </div>
    );
  }

  function changeIcon(type: DiffEntry["changeType"]) {
    switch (type) {
      case "improved": return <TrendingUp className="size-3 text-emerald-400" />;
      case "degraded": return <TrendingDown className="size-3 text-red-400" />;
      case "new": return <TrendingUp className="size-3 text-blue-400" />;
      case "removed": return <AlertTriangle className="size-3 text-amber-400" />;
      default: return <Minus className="size-3 text-muted-foreground/40" />;
    }
  }

  function changeColor(type: DiffEntry["changeType"]) {
    switch (type) {
      case "improved": return "border-emerald-500/20 bg-emerald-500/5";
      case "degraded": return "border-red-500/20 bg-red-500/5";
      case "new": return "border-blue-500/20 bg-blue-500/5";
      case "removed": return "border-amber-500/20 bg-amber-500/5";
      default: return "border-white/5 bg-white/[0.02]";
    }
  }

  return (
    <div className="space-y-3">
      {snapshots.map((snap) => (
        <div key={snap.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="size-3 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/50">
                {new Date(snap.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground/40">{snap.source}</span>
            </div>
            <span className="text-[9px] text-muted-foreground/30">{snap.diffs.length} change{snap.diffs.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-1">
            {snap.diffs.map((d, i) => (
              <div key={i} className={`flex items-start gap-2 rounded border px-2.5 py-1.5 ${changeColor(d.changeType)}`}>
                {changeIcon(d.changeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-foreground/70">{d.field}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/40 line-through truncate max-w-[120px]">{d.previous}</span>
                    <ArrowRight className="size-2.5 text-muted-foreground/30 shrink-0" />
                    <span className="text-[10px] text-foreground/70 truncate max-w-[120px]">{d.current}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
