"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CorridorImpactResult } from "@/features/scenario-simulator/types";

type Props = { nodeImpacts: CorridorImpactResult[] };

const NODE_COLOR: Record<string, string> = {
  corridor: "#a78bfa",
  port: "#60a5fa",
  industry: "#fb923c",
  infrastructure: "#fb923c",
};

export function SupplyGapWaterfallChart({ nodeImpacts }: Props) {
  const contributing = nodeImpacts
    .filter((n) => n.lockedVolumeMtpa !== null && n.lockedVolumeMtpa > 0)
    .sort((a, b) => b.lockedVolumeMtpa! - a.lockedVolumeMtpa!);

  if (contributing.length === 0) return null;

  const data = contributing.map((n) => ({
    name: n.nodeLabel.length > 16 ? n.nodeLabel.slice(0, 14) + "…" : n.nodeLabel,
    fullName: n.nodeLabel,
    locked: +(n.lockedVolumeMtpa!.toFixed(2)),
    type: n.nodeType,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-foreground mb-1">{d.fullName}</div>
        <div className="text-muted-foreground">
          Locked: <span className="text-foreground font-bold">{d.locked.toFixed(2)} Mtpa</span>
        </div>
        <div className="text-muted-foreground/60 text-[10px] capitalize">{d.type} node</div>
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Supply Gap by Node (Locked Volume)
      </div>
      <div className="mb-3 text-[10px] text-muted-foreground/50">
        Volume that cannot be rerouted due to contract / flexibility constraints (Mtpa)
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 40 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
            unit=" Mt"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="locked" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={NODE_COLOR[entry.type] ?? "#60a5fa"} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
