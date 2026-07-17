"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { INDIA_RESERVE_CONFIG } from "@/features/scenario-simulator/constants/reserve-config";

type ReserveDepletionChartProps = {
  startingDays: number;
  dailyDrawdownMtpa: number;
  durationDays: number;
  clippedByFloor: boolean;
  sustainedDays: number;
};

export function ReserveDepletionChart({ startingDays, dailyDrawdownMtpa, durationDays, clippedByFloor, sustainedDays }: ReserveDepletionChartProps) {
  const dailyConsumptionMtpa = INDIA_RESERVE_CONFIG.normalConsumptionMtpa / 365;
  const coverLostPerDay = dailyDrawdownMtpa / dailyConsumptionMtpa;
  
  const data = [];
  
  for (let day = 0; day <= durationDays; day++) {
    let daysCover = startingDays - (day * coverLostPerDay);
    if (daysCover < INDIA_RESERVE_CONFIG.minReserveFloorDays) {
      daysCover = INDIA_RESERVE_CONFIG.minReserveFloorDays;
    }
    data.push({
      day,
      cover: daysCover
    });
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/10 bg-[#0a0e14] p-2 text-xs shadow-xl">
          <div className="font-semibold text-muted-foreground mb-1">Day {label}</div>
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
            <div className="size-2 rounded-full bg-[#4fd1d9]" />
            <span className="text-foreground font-medium tabular-nums">{payload[0].value.toFixed(1)} days cover</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-40 w-full mt-4 select-none">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Reserve Depletion Trajectory</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickFormatter={(val) => `D${val}`} minTickGap={20} />
          <YAxis 
            domain={[
              0, 
              Math.ceil(Math.max(startingDays, INDIA_RESERVE_CONFIG.minReserveFloorDays) + 5)
            ]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={INDIA_RESERVE_CONFIG.minReserveFloorDays} 
            stroke="rgba(232, 147, 90, 0.5)" 
            strokeDasharray="3 3" 
            label={{ value: "20d Policy Floor", position: "insideBottomRight", fill: "rgba(232, 147, 90, 0.7)", fontSize: 10, offset: 5 }} 
          />
          <Line 
            type="linear" 
            dataKey="cover" 
            stroke="#4fd1d9" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 4, fill: "#4fd1d9" }} 
            isAnimationActive={true} 
            animationDuration={1500} 
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
