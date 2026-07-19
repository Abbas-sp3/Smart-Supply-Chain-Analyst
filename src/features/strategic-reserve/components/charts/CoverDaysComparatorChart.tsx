"use client";

import {
  BarChart,
  Bar,
  Cell,
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

const IEA_NORM_DAYS = 90;
const CURRENT_COVER_DAYS = 64;

type Props = { strategy: OptimizationRecommendation };

export function CoverDaysComparatorChart({ strategy }: Props) {
  const config = INDIA_RESERVE_CONFIG;
  const dailyConsumption = config.normalConsumptionMtpa / 365;
  const startingVolumeMMT = config.totalReserveDays * dailyConsumption;
  const afterDrawdownMMT = Math.max(0, startingVolumeMMT - strategy.totalVolumeDeployedMMT);
  const afterDrawdownDays = afterDrawdownMMT / dailyConsumption;

  const data = [
    {
      scenario: "Current",
      days: CURRENT_COVER_DAYS,
      fill: "#facc15",
    },
    ...(strategy.recommendRelease ? [{
      scenario: "Post-Drawdown",
      days: Math.round(afterDrawdownDays),
      fill: strategy.breachesFloor ? "#f87171" : "#34d399",
    }] : []),
    {
      scenario: "IEA Norm",
      days: IEA_NORM_DAYS,
      fill: "#60a5fa",
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-foreground mb-1">{label}</div>
        <div className="text-muted-foreground">
          Cover: <span className="text-foreground font-bold">{payload[0].value} days</span>
        </div>
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Days of Cover — Before vs After Drawdown
      </div>
      <div className="mb-3 text-[10px] text-muted-foreground/50">
        Estimated cover at current consumption rate · IEA norm: 90 days
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="scenario"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit="d"
            domain={[0, Math.max(IEA_NORM_DAYS + 10, CURRENT_COVER_DAYS + 10)]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <ReferenceLine
            y={IEA_NORM_DAYS}
            stroke="rgba(96,165,250,0.4)"
            strokeDasharray="5 3"
            label={{ value: "IEA 90d", fill: "rgba(96,165,250,0.6)", fontSize: 9, position: "insideTopRight" }}
          />
          <Bar dataKey="days" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
