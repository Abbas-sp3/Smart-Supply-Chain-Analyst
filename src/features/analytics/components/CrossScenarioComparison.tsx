"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { AlertCircle, HelpCircle } from "lucide-react";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { runPropagation } from "@/features/scenario-simulator/services/propagationEngine";
import { generateOptimizationStrategy } from "@/features/strategic-reserve/services/optimizationEngine";
import { AuditTrailModal } from "@/components/ui/AuditTrailModal";

const COLORS = ["#f59e0b", "#f43f5e", "#38bdf8", "#10b981", "#8b5cf6", "#eab308"];

export function CrossScenarioComparison() {
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

  // Compute all metrics deterministically on load
  const data = useMemo(() => {
    return DISRUPTION_PRESETS.map((preset, index) => {
      const propagation = runPropagation(preset, []);
      const optimization = generateOptimizationStrategy(propagation);

      return {
        id: preset.id,
        name: preset.label,
        color: COLORS[index % COLORS.length],
        supplyGapMtpa: propagation.metrics.supplyGapMtpa.likely,
        daysOfCoverImpact: 90 - (90 * (propagation.metrics.supplyGapMtpa.likely / 250)), // illustrative impact mapping
        optimization,
        topRefinery: optimization.prioritizedRefineries[0] || null
      };
    });
  }, []);

  return (
    <div className="solid-card flex flex-col overflow-hidden rounded-xl border border-white/10 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold uppercase tracking-wider text-foreground">
              Cross-Scenario Comparison
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Computed live from the Propagation Engine across all configured disruption presets.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 flex-1">
        
        {/* Supply Gap Chart */}
        <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            Supply Gap (Mtpa)
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "#ffffff80", fontSize: 10 }}
                  width={110}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff05" }}
                  contentStyle={{
                    backgroundColor: "#09090b",
                    border: "1px solid #ffffff10",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#888", marginBottom: "4px" }}
                />
                <Bar dataKey="supplyGapMtpa" name="Supply Gap" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Refineries Table */}
        <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            Most Critical Refinery Impact
          </h3>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500">
                  <th className="pb-2 font-medium">Scenario</th>
                  <th className="pb-2 font-medium">Refinery</th>
                  <th className="pb-2 font-medium text-right">Locked Vol (Mtpa)</th>
                  <th className="pb-2 pl-4 font-medium text-center">Audit</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[120px]" title={item.name}>{item.name}</span>
                    </td>
                    <td className="py-2.5">
                      {item.topRefinery ? item.topRefinery.name : <span className="text-zinc-600">None affected</span>}
                    </td>
                    <td className="py-2.5 text-right font-medium text-white tabular-nums">
                      {item.topRefinery ? item.topRefinery.lockedVolumeMtpa.toFixed(1) : "—"}
                    </td>
                    <td className="py-2.5 pl-4 text-center">
                      <button
                        onClick={() => setSelectedAudit(item)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                      >
                        <HelpCircle className="size-3" />
                        Why?
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AuditTrailModal
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        title={`Decision Audit: ${selectedAudit?.name}`}
        reasoning={selectedAudit?.optimization.reasoning || []}
        metrics={selectedAudit?.optimization ? {
          supplyGapMtpa: selectedAudit.optimization.supplyGapMtpa,
          breachesFloor: selectedAudit.optimization.breachesFloor,
          estimatedReplenishmentDays: selectedAudit.optimization.estimatedReplenishmentDays,
          targetDailyRateMtpa: selectedAudit.optimization.effectiveDailyRateMtpa,
        } : undefined}
      />
    </div>
  );
}
