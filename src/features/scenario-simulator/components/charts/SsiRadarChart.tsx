"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SsiWeights } from "@/features/scenario-simulator/types";

type Props = { ssiWeightsUsed: SsiWeights };

export function SsiRadarChart({ ssiWeightsUsed }: Props) {
  const data = [
    { subject: "Supply Gap", weight: ssiWeightsUsed.supplyGapVolume * 100 },
    { subject: "ETA Shift", weight: ssiWeightsUsed.etaShift * 100 },
    { subject: "Reserve Runway", weight: ssiWeightsUsed.reserveTrajectory * 100 },
    { subject: "Freight & Ins", weight: ssiWeightsUsed.freightAndInsuranceCost * 100 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
        <div className="font-semibold text-foreground mb-1">{label}</div>
        <div className="text-muted-foreground">
          Weight: <span className="text-foreground font-bold">{payload[0].value.toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="solid-card rounded-xl border border-white/10 p-5 flex flex-col h-full">
      <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        SSI Weight Decomposition
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 40]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Weights"
              dataKey="weight"
              stroke="#fb923c"
              fill="#fb923c"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
