"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Scatter, ComposedChart, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import type { RangeEstimate } from "@/features/scenario-simulator/types";

type MetricRangeChartProps = {
  baseline: RangeEstimate;
  lever: RangeEstimate;
  unit: string;
  lowerIsBetter?: boolean;
};

// Custom shape for the "likely" marker
const CustomMarker = (props: any) => {
  const { cx, cy, fill } = props;
  if (!cx || !cy) return null;
  return (
    <rect x={cx - 1.5} y={cy - 6} width={3} height={12} fill={fill} rx={1} />
  );
};

export function MetricRangeChart({ baseline, lever, unit, lowerIsBetter = true }: MetricRangeChartProps) {
  const data = [
    {
      name: "Baseline",
      range: [baseline.min, baseline.max],
      min: baseline.min,
      max: baseline.max,
      likely: baseline.likely,
    },
    {
      name: "Levers",
      range: [lever.min, lever.max],
      min: lever.min,
      max: lever.max,
      likely: lever.likely,
    },
  ];

  // We want to calculate the domain for the X-axis so it frames the data nicely.
  const allValues = [baseline.min, baseline.max, lever.min, lever.max, baseline.likely, lever.likely];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  
  // Add some padding to the domain
  const padding = (dataMax - dataMin) * 0.1;
  const domainMin = Math.max(0, dataMin - padding);
  const domainMax = dataMax + padding;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="rounded-lg border border-white/10 bg-[#0a0e14] p-2 text-xs shadow-xl">
          <div className="font-semibold text-muted-foreground mb-1">{p.name}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="text-muted-foreground">Range:</span>
            <span className="text-right text-foreground font-medium tabular-nums">{p.min.toFixed(1)} – {p.max.toFixed(1)} {unit}</span>
            <span className="text-muted-foreground">Likely:</span>
            <span className="text-right text-foreground font-medium tabular-nums">{p.likely.toFixed(1)} {unit}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const accentColor = lowerIsBetter ? "#e8935a" : "#4fd1d9";

  return (
    <div className="h-16 w-full mt-1.5 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" domain={[domainMin, domainMax]} hide />
          <YAxis type="category" dataKey="name" width={60} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
          
          <Bar dataKey="range" fill={accentColor} fillOpacity={0.15} barSize={12} radius={2} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
          <Scatter dataKey="likely" fill={accentColor} shape={<CustomMarker />} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
