"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useCountry } from "@/hooks/useCountry";
import type { OptimizationRecommendation } from "@/features/strategic-reserve/services/optimizationEngine";
import { TrendingDown, ShieldAlert, Zap, Clock, Droplets } from "lucide-react";

type Props = { 
  strategy: OptimizationRecommendation;
};

export function DrawdownProjectionChart({ strategy }: Props) {
  const { activeCountry } = useCountry();
  const config = activeCountry.reserveConfig;
  
  const dailyConsumption = config.normalConsumptionMtpa / 365;
  const startingVolumeMMT = config.totalReserveDays * dailyConsumption;
  const floorVolumeMMT = config.minReserveFloorDays * dailyConsumption;
  const totalDays = Math.max(strategy.durationDays + 15, 60);

  // Daily supply deficit in MMT/day
  const dailyDeficitMMT = strategy.supplyGapMtpa / 365;
  // Daily strategic relief deployed in MMT/day
  const dailyReliefMMT = strategy.effectiveDailyRateMtpa;

  const data = useMemo(() => {
    const points: { 
      day: number; 
      unmitigatedStock: number; 
      bufferedStock: number; 
      deficitRate: number;
    }[] = [];

    for (let d = 0; d <= totalDays; d++) {
      // 1. Unmitigated depletion: stock steadily drains due to ongoing daily deficit
      const unmitigated = Math.max(
        0, 
        startingVolumeMMT - (dailyDeficitMMT * Math.min(d, strategy.durationDays))
      );

      // 2. Buffered trajectory: strategic stock injection offsets the deficit
      const netDailyDrain = Math.max(0, dailyDeficitMMT - dailyReliefMMT);
      const buffered = Math.max(
        floorVolumeMMT * 0.8, // Allow visualization down near the floor
        startingVolumeMMT - (netDailyDrain * Math.min(d, strategy.durationDays))
      );

      points.push({
        day: d,
        unmitigatedStock: +unmitigated.toFixed(2),
        bufferedStock: +buffered.toFixed(2),
        deficitRate: +(dailyDeficitMMT * 1000).toFixed(0), // in kMT
      });
    }
    return points;
  }, [startingVolumeMMT, floorVolumeMMT, dailyDeficitMMT, dailyReliefMMT, totalDays, strategy.durationDays]);

  // Calculate days until floor breach under unmitigated drain
  const daysToFloorUnmitigated = dailyDeficitMMT > 0 
    ? Math.floor((startingVolumeMMT - floorVolumeMMT) / dailyDeficitMMT)
    : Infinity;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-white/10 bg-[#090d16]/95 p-3 text-xs shadow-2xl backdrop-blur-md min-w-[200px]">
        <div className="text-slate-400 font-bold mb-2 pb-1 border-b border-white/10">Day {label} Timeline</div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-rose-400">
            <span>Unmitigated Drain:</span>
            <span className="font-bold tabular-nums">{payload[0]?.value?.toFixed(2)} MMT</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Buffered Trajectory:</span>
            <span className="font-bold tabular-nums">{payload[1]?.value?.toFixed(2)} MMT</span>
          </div>
          <div className="flex justify-between items-center text-sky-400 pt-1 border-t border-white/5 text-[10px]">
            <span>Daily Supply Gap:</span>
            <span className="font-semibold tabular-nums">{(dailyDeficitMMT * 1000).toFixed(0)} kMT/d</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <TrendingDown className="size-3.5 text-rose-400" />
            Reserve Drawdown &amp; Inventory Depletion Curve
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-0.5">
            Dynamic inventory trajectory under {strategy.durationDays}-day disruption ({activeCountry.name})
          </div>
        </div>
        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          {strategy.recommendRelease ? "Strategic Injection Active" : "Normal Stockholding"}
        </span>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Droplets className="size-3 text-rose-400" /> Daily Deficit Rate
          </div>
          <div className="text-sm font-bold text-rose-400 tabular-nums mt-0.5">
            {(dailyDeficitMMT * 1000).toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">kMT/d</span>
          </div>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Zap className="size-3 text-emerald-400" /> Strategic Relief Rate
          </div>
          <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
            {(dailyReliefMMT * 1000).toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">kMT/d</span>
          </div>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-3 text-amber-400" /> Days to Floor (Unmitigated)
          </div>
          <div className="text-sm font-bold text-amber-400 tabular-nums mt-0.5">
            {daysToFloorUnmitigated !== Infinity ? `${daysToFloorUnmitigated} days` : "Safe"}
          </div>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="size-3 text-sky-400" /> Net Volume Deployed
          </div>
          <div className="text-sm font-bold text-sky-400 tabular-nums mt-0.5">
            {strategy.totalVolumeDeployedMMT.toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">MMT</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="unmitigatedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="bufferedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Days into Disruption", position: "insideBottomRight", fill: "rgba(255,255,255,0.35)", fontSize: 10, offset: -4 }}
          />
          <YAxis
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit=" MMT"
            width={58}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            align="right"
            wrapperStyle={{ fontSize: 10, paddingBottom: 8 }} 
          />
          
          {/* Minimum Policy Floor (e.g. 20-30 days) */}
          <ReferenceLine
            y={floorVolumeMMT}
            stroke="#f87171"
            strokeDasharray="4 4"
            label={{ 
              value: `Critical Strategic Floor (${config.minReserveFloorDays}d)`, 
              fill: "#f87171", 
              fontSize: 9, 
              position: "insideTopLeft" 
            }}
          />

          {/* End of Disruption Duration */}
          <ReferenceLine
            x={strategy.durationDays}
            stroke="rgba(251,191,36,0.6)"
            strokeDasharray="4 4"
            label={{ 
              value: `End of Disruption (${strategy.durationDays}d)`, 
              fill: "#fbbf24", 
              fontSize: 9, 
              position: "insideTopRight" 
            }}
          />

          {/* 1. Unmitigated Line & Area (Red/Rose) */}
          <Area
            type="monotone"
            dataKey="unmitigatedStock"
            name="Unmitigated Depletion (No Strategic Release)"
            stroke="#f43f5e"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#unmitigatedGrad)"
          />

          {/* 2. Buffered Line & Area (Green/Emerald) */}
          <Area
            type="monotone"
            dataKey="bufferedStock"
            name="Buffered Trajectory (With Optimized Release)"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#bufferedGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
