"use client";

import { Network, TrendingDown, TrendingUp } from "lucide-react";
import type { GraphCentralityRank, ResilienceRank } from "@/features/analytics/services/analyticsEngine";

type Props = {
  graphCentralityRanks: GraphCentralityRank[];
  resilienceRanks: ResilienceRank[];
};

const TYPE_COLORS: Record<string, string> = {
  corridor: "text-amber-400",
  port: "text-sky-400",
  infrastructure: "text-orange-400",
  country: "text-violet-400",
  product: "text-teal-400",
  resource: "text-emerald-400",
};

export function KnowledgeGraphAnalytics({ graphCentralityRanks, resilienceRanks }: Props) {
  const mostCentral = graphCentralityRanks.slice(0, 8);
  const mostResilient = resilienceRanks.slice(0, 4);
  const leastResilient = [...resilienceRanks].reverse().slice(0, 4);
  const maxConnections = Math.max(...mostCentral.map((r) => r.connectionCount), 1);
  const maxCritical = Math.max(...mostCentral.map((r) => r.criticalConnectionCount), 1);

  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Network className="size-4 text-violet-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
          Knowledge Graph Analytics
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50">
          India Trade Graph — structural analysis
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Most central nodes */}
        <div className="md:col-span-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Most Critical Infrastructure Nodes (by Connection Count)
          </p>
          <div className="space-y-2.5">
            {mostCentral.map((node, i) => (
              <div key={node.nodeId} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-center text-[10px] font-bold text-muted-foreground/50">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium truncate max-w-[200px] ${TYPE_COLORS[node.type] ?? "text-foreground/80"}`}
                      title={node.label}
                    >
                      {node.label}
                    </span>
                    <span className="ml-2 shrink-0 text-[10px] tabular-nums text-muted-foreground/60">
                      {node.criticalConnectionCount} critical / {node.connectionCount} total
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {/* Total connections bar */}
                    <div className="flex-1 rounded-full bg-white/5">
                      <div
                        className="h-1.5 rounded-full bg-violet-500/50 transition-all"
                        style={{ width: `${(node.connectionCount / maxConnections) * 100}%` }}
                      />
                    </div>
                    {/* Critical connections bar */}
                    <div className="flex-1 rounded-full bg-white/5">
                      <div
                        className="h-1.5 rounded-full bg-red-500/70 transition-all"
                        style={{ width: `${(node.criticalConnectionCount / maxCritical) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-violet-500/50" /> Total connections
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500/70" /> Critical connections
            </span>
          </div>
        </div>

        {/* Resilience rankings */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Resilience Rankings
          </p>

          <p className="mb-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-400/70">
            <TrendingUp className="size-3" /> Most Resilient
          </p>
          <div className="mb-4 space-y-1.5">
            {mostResilient.map((r) => (
              <div key={r.nodeId} className="flex items-center justify-between rounded bg-emerald-500/5 px-2 py-1.5 border border-emerald-500/10">
                <span className="text-[10px] text-foreground/80 truncate max-w-[120px]" title={r.label}>
                  {r.label}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  {(r.flexibilityFactor * 100).toFixed(0)}% flex
                </span>
              </div>
            ))}
          </div>

          <p className="mb-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-red-400/70">
            <TrendingDown className="size-3" /> Most Vulnerable
          </p>
          <div className="space-y-1.5">
            {leastResilient.map((r) => (
              <div key={r.nodeId} className="flex items-center justify-between rounded bg-red-500/5 px-2 py-1.5 border border-red-500/10">
                <span className="text-[10px] text-foreground/80 truncate max-w-[120px]" title={r.label}>
                  {r.label}
                </span>
                <span className="text-[10px] font-semibold text-red-400">
                  {(r.baseUtilizationPct ?? 0).toFixed(0)}% util
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
