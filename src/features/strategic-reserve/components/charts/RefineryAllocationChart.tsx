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
} from "recharts";
import type { OptimizationRecommendation } from "@/features/strategic-reserve/services/optimizationEngine";

type Props = { prioritizedRefineries: OptimizationRecommendation["prioritizedRefineries"] };

const TIER_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa"];

export function RefineryAllocationChart({ prioritizedRefineries }: Props) {
  if (!prioritizedRefineries || prioritizedRefineries.length === 0) {
    return (
      <div className="solid-card rounded-xl border border-white/10 p-5 flex items-center justify-center min-h-[120px]">
        <p className="text-xs text-muted-foreground">No refinery lockups detected for this scenario.</p>
      </div>
    );
  }

  const data = prioritizedRefineries.map((r, i) => ({
    name: r.name.length > 20 ? r.name.slice(0, 18) + "…" : r.name,
    fullName: r.name,
    volume: +(r.lockedVolumeMtpa).toFixed(2),
    rank: i + 1,
    color: TIER_COLORS[Math.min(i, TIER_COLORS.length - 1)],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-foreground mb-1">#{d.rank} {d.fullName}</div>
        <div className="text-muted-foreground">Locked volume: <span className="text-foreground font-bold">{d.volume.toFixed(2)} Mtpa</span></div>
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Refinery Priority Allocation
      </div>
      <div className="mb-3 text-[10px] text-muted-foreground/50">
        Sorted by locked (inflexible) supply dependency — highest first
      </div>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit=" Mt"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="volume" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
