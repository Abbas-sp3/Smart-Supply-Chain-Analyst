"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Scatter, ComposedChart, ResponsiveContainer } from "recharts";
import type { RangeEstimate } from "@/features/scenario-simulator/types";

// Custom shape for the "likely" marker
const CustomMarker = (props: any) => {
  const { cx, cy, fill } = props;
  if (!cx || !cy) return null;
  return (
    <rect x={cx - 1.5} y={cy - 6} width={3} height={12} fill={fill} rx={1} />
  );
};

type Props = {
  range: RangeEstimate;
  maxVal: number;
  colorClass?: string; // e.g. "bg-amber-500/80" -> we need a hex color for recharts, but we'll try to map it or use a default
};

export function SingleRangeBarChart({ range, maxVal, colorClass }: Props) {
  const data = [
    {
      name: "Range",
      range: [range.min, range.max],
      min: range.min,
      max: range.max,
      likely: range.likely,
    }
  ];

  // Extract a base hex color from the tailwind class string if possible, or fallback to primary
  let fillHex = "#60a5fa"; // fallback blue
  if (colorClass?.includes("rose")) fillHex = "#f43f5e";
  else if (colorClass?.includes("amber")) fillHex = "#f59e0b";
  else if (colorClass?.includes("fuchsia")) fillHex = "#d946ef";
  else if (colorClass?.includes("blue")) fillHex = "#3b82f6";
  else if (colorClass?.includes("indigo")) fillHex = "#6366f1";

  return (
    <div className="h-6 w-full select-none mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, maxVal]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar dataKey="range" fill={fillHex} fillOpacity={0.2} barSize={8} radius={2} isAnimationActive={false} />
          <Scatter dataKey="likely" fill={fillHex} shape={<CustomMarker />} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
