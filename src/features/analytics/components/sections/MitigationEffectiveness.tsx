"use client";

import { Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import type { MitigationComparison } from "@/features/analytics/services/analyticsEngine";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";

type Props = {
  mitigationComparison: MitigationComparison[];
  activePreset: DisruptionPreset;
};

const COLORS = ["#ef4444", "#f59e0b", "#38bdf8", "#10b981"];

export function MitigationEffectiveness({ mitigationComparison, activePreset }: Props) {
  const chartData = mitigationComparison.map((item, i) => ({
    name: item.label,
    gap: parseFloat(item.supplyGapMtpa.toFixed(2)),
    gapClosed: parseFloat(item.gapClosedPct.toFixed(1)),
    color: COLORS[i],
  }));

  const baseGap = mitigationComparison[0]?.supplyGapMtpa ?? 0;
  const combinedItem = mitigationComparison[3];

  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Zap className="size-4 text-emerald-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          Mitigation Effectiveness
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/60 truncate max-w-[200px]">
          Active: {activePreset.label}
        </span>
      </div>

      {/* Summary callout */}
      {combinedItem && baseGap > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
          <Zap className="size-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-foreground/80">
            Combined mitigation closes{" "}
            <span className="font-bold text-emerald-400">
              {combinedItem.gapClosedPct.toFixed(0)}%
            </span>{" "}
            of the supply gap — reducing the deficit from{" "}
            <span className="font-medium text-white">{baseGap.toFixed(1)} Mtpa</span> to{" "}
            <span className="font-medium text-white">{combinedItem.supplyGapMtpa.toFixed(1)} Mtpa</span>.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar chart */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Remaining Supply Gap by Strategy
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#ffffff60", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val) =>
                    val.length > 14 ? val.substring(0, 14) + "…" : val
                  }
                />
                <YAxis
                  tick={{ fill: "#ffffff50", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                  unit=" Mtpa"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid #ffffff10",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#888" }}
                  formatter={(val: any) => [`${val} Mtpa`, "Supply Gap"]}
                />
                <ReferenceLine y={0} stroke="#ffffff20" />
                <Bar dataKey="gap" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy detail table */}
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Strategy Details
          </p>
          <div className="space-y-3">
            {mitigationComparison.map((item, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-[#181e28] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    {item.label}
                  </span>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: COLORS[i] }}>
                    {item.gapClosedPct > 0 ? `${item.gapClosedPct.toFixed(0)}% closed` : "Baseline"}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground/70">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
