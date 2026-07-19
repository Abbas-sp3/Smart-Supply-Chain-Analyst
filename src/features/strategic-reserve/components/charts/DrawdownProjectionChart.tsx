"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { INDIA_RESERVE_CONFIG } from "@/features/scenario-simulator/constants/reserve-config";
import type { OptimizationRecommendation } from "@/features/strategic-reserve/services/optimizationEngine";

type Props = { strategy: OptimizationRecommendation };

export function DrawdownProjectionChart({ strategy }: Props) {
  const config = INDIA_RESERVE_CONFIG;
  const dailyConsumption = config.normalConsumptionMtpa / 365;
  const startingVolumeMMT = config.totalReserveDays * dailyConsumption;
  const floorVolumeMMT = config.minReserveFloorDays * dailyConsumption;
  const totalDays = Math.max(strategy.durationDays + 10, 60);

  const data: { day: number; current: number; drawdown: number }[] = [];

  for (let d = 0; d <= totalDays; d++) {
    const current = startingVolumeMMT; // static (no drawdown)
    const drawdown = strategy.recommendRelease
      ? Math.max(floorVolumeMMT, startingVolumeMMT - strategy.effectiveDailyRateMtpa * d)
      : startingVolumeMMT;

    data.push({ day: d, current: +current.toFixed(3), drawdown: +drawdown.toFixed(3) });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
        <div className="text-muted-foreground mb-1">Day {label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex gap-2">
            <span style={{ color: p.color }}>{p.name}:</span>
            <span className="text-foreground font-bold">{p.value.toFixed(2)} MMT</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Reserve Drawdown Projection
      </div>
      <div className="mb-3 text-[10px] text-muted-foreground/50">
        Projected reserve volume over disruption duration (MMT)
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="day"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Days", position: "insideBottomRight", fill: "rgba(255,255,255,0.3)", fontSize: 10, offset: -4 }}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit=" MMT"
            width={58}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} />
          {/* Policy floor */}
          <ReferenceLine
            y={floorVolumeMMT}
            stroke="#f87171"
            strokeDasharray="5 3"
            label={{ value: `${config.minReserveFloorDays}d floor`, fill: "#f87171", fontSize: 9, position: "insideTopRight" }}
          />
          {/* End of disruption */}
          {strategy.recommendRelease && (
            <ReferenceLine
              x={strategy.durationDays}
              stroke="rgba(251,191,36,0.4)"
              strokeDasharray="4 4"
              label={{ value: "End disruption", fill: "rgba(251,191,36,0.6)", fontSize: 9, position: "top" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="current"
            name="No Drawdown"
            stroke="#60a5fa"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
          {strategy.recommendRelease && (
            <Line
              type="monotone"
              dataKey="drawdown"
              name="With Drawdown"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
