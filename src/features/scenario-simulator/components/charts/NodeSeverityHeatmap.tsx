"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { CorridorImpactResult } from "@/features/scenario-simulator/types";

const NODE_COLOR: Record<string, string> = {
  corridor: "#a78bfa", // violet-400
  port: "#60a5fa",     // blue-400
  industry: "#fb923c", // orange-400
  infrastructure: "#fb923c",
};

type Props = { nodeImpacts: CorridorImpactResult[] };

export function NodeSeverityHeatmap({ nodeImpacts }: Props) {
  const data = nodeImpacts
    .filter((n) => n.lockedVolumeMtpa !== null && n.lockedVolumeMtpa > 0)
    .sort((a, b) => b.effectiveSeverityPct - a.effectiveSeverityPct)
    .map((n) => ({
      name: n.nodeLabel.length > 18 ? n.nodeLabel.slice(0, 16) + "…" : n.nodeLabel,
      fullName: n.nodeLabel,
      severity: n.effectiveSeverityPct,
      locked: n.lockedVolumeMtpa ?? 0,
      type: n.nodeType,
    }));

  if (data.length === 0) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-foreground mb-1">{d.fullName}</div>
        <div className="text-muted-foreground">Severity: <span className="text-foreground font-bold">{d.severity.toFixed(0)}%</span></div>
        <div className="text-muted-foreground">Locked volume: <span className="text-foreground font-bold">{d.locked.toFixed(1)} Mtpa</span></div>
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Node Severity Overview
      </div>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 28)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <ReferenceLine x={50} stroke="rgba(251,146,60,0.3)" strokeDasharray="3 3" />
          <ReferenceLine x={80} stroke="rgba(248,113,113,0.3)" strokeDasharray="3 3" />
          <Bar dataKey="severity" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={NODE_COLOR[entry.type] ?? "#60a5fa"} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground/50">
        <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-violet-400/80" />Corridor</span>
        <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-blue-400/80" />Port</span>
        <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-orange-400/80" />Infrastructure</span>
      </div>
    </div>
  );
}
