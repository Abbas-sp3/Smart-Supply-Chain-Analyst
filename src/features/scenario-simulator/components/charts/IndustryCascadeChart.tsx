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
  ReferenceLine,
} from "recharts";
import type { MetricsSurface } from "@/features/scenario-simulator/types";

type Props = { industryOutputRiskPct: MetricsSurface["industryOutputRiskPct"] };

const INDUSTRY_LABELS: Record<string, string> = {
  ind_petroleum_refining: "Petroleum Refining",
  ind_fertilizer: "Fertilizers",
  ind_power_generation: "Power Generation",
  ind_steel: "Steel",
  ind_chemicals: "Chemicals",
  ind_automotive: "Automotive",
  ind_textiles: "Textiles",
  ind_food_processing: "Food Processing",
};

export function IndustryCascadeChart({ industryOutputRiskPct }: Props) {
  const entries = Object.entries(industryOutputRiskPct)
    .filter(([, range]) => range.likely > 0)
    .sort(([, a], [, b]) => b.likely - a.likely);

  if (entries.length === 0) return null;

  const data = entries.map(([id, range]) => ({
    name: (INDUSTRY_LABELS[id] ?? id.replace(/^ind_/, "").replace(/_/g, " ")).split(" ").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" "),
    min: +range.min.toFixed(1),
    likely: +range.likely.toFixed(1),
    max: +range.max.toFixed(1),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-foreground mb-1">{label}</div>
        <div className="text-muted-foreground">Min: <span className="text-foreground font-bold">{d?.min}%</span></div>
        <div className="text-muted-foreground">Likely: <span className="text-orange-400 font-bold">{d?.likely}%</span></div>
        <div className="text-muted-foreground">Max: <span className="text-red-400 font-bold">{d?.max}%</span></div>
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Industry Output Risk (Cascade)
      </div>
      <div className="mb-3 text-[10px] text-muted-foreground/50">
        % of normal output at risk if disruption persists beyond industry buffer days
      </div>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 50, left: 10, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
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
          <Legend
            wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
          />
          <ReferenceLine x={25} stroke="rgba(251,146,60,0.3)" strokeDasharray="4 4" />
          <ReferenceLine x={50} stroke="rgba(248,113,113,0.3)" strokeDasharray="4 4" />
          <Bar dataKey="min" name="Min" fill="#94a3b8" fillOpacity={0.4} radius={[0, 0, 0, 0]} maxBarSize={12} stackId="a" />
          <Bar dataKey="likely" name="Likely" fill="#fb923c" fillOpacity={0.8} radius={[0, 4, 4, 0]} maxBarSize={12} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
