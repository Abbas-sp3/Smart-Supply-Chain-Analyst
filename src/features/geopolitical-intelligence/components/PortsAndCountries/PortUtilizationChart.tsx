"use client";

import { useMemo } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getAllNodesByType } from "../../knowledge-graph/utils";

type Props = {
  affectedPortNames: string[];
};

export function PortUtilizationChart({ affectedPortNames }: Props) {
  const data = useMemo(() => {
    const allPorts = getAllNodesByType("port");
    
    return allPorts
      .filter(p => {
        return affectedPortNames.some(ap => 
          ap.toLowerCase() === p.label.toLowerCase() || 
          p.aliases?.some(alias => alias.toLowerCase() === ap.toLowerCase()) ||
          ap.toLowerCase().includes(p.label.toLowerCase()) ||
          p.label.toLowerCase().includes(ap.toLowerCase())
        );
      })
      .map((p) => ({
        name: p.label,
        utilization: p.baseUtilizationPct || 0,
        capacity: p.capacityMtpa || 0,
        fill: (p.baseUtilizationPct || 0) >= 80 ? "#ef4444" : (p.baseUtilizationPct || 0) >= 60 ? "#eab308" : "#22c55e",
      }))
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 4); // Show top 4 most constrained affected ports
  }, [affectedPortNames]);

  if (data.length === 0) return null;

  return (
    <div className="solid-card mt-4 rounded-xl border border-white/10 p-5">
      <div className="mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          At-Risk Port Constraints
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          Base utilization vs Total Capacity (Mtpa). High utilization indicates limited slack to absorb shocks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {data.map((port, i) => (
          <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <div className="text-xs font-medium text-slate-200 text-center line-clamp-1 mb-2">{port.name}</div>
            <div className="relative h-24 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="50%" 
                  innerRadius="70%" outerRadius="100%" 
                  barSize={8} 
                  data={[port]} 
                  startAngle={180} endAngle={-180}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar 
                    background={{ fill: "rgba(255,255,255,0.05)" }}
                    dataKey="utilization" 
                    cornerRadius={4}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-slate-100">{port.utilization}%</span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              Capacity: <span className="text-slate-300 font-semibold">{port.capacity} Mtpa</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[9px] text-muted-foreground/50 text-center">
        * Baseline utilization derived from Ministry of Ports, Shipping & Waterways data.
      </div>
    </div>
  );
}
