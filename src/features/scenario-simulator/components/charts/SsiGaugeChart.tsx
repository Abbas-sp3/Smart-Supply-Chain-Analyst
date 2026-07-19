"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const SSI_COLOR = (score: number) => {
  if (score >= 70) return "#34d399"; // emerald-400
  if (score >= 45) return "#facc15"; // yellow-400
  if (score >= 20) return "#fb923c"; // orange-400
  return "#f87171"; // red-400
};

const SSI_LABEL = (score: number) => {
  if (score >= 70) return "Secure";
  if (score >= 45) return "At Risk";
  if (score >= 20) return "Stressed";
  return "Critical";
};

export function SsiGaugeChart({ score }: { score: number }) {
  const color = SSI_COLOR(score);
  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-36 h-[72px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[144px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              data={data}
              barSize={12}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                background={{ fill: "rgba(255,255,255,0.04)" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        {/* Center label */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span
            className="text-3xl font-black tabular-nums leading-none"
            style={{ color }}
          >
            {score}
          </span>
          <span
            className="text-[10px] font-semibold mt-1"
            style={{ color }}
          >
            {SSI_LABEL(score)}
          </span>
        </div>
      </div>
    </div>
  );
}
