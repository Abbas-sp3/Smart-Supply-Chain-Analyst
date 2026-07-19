"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { getAllNodesByType } from "../../knowledge-graph/utils";

type Props = {
  affectedCorridorNames: string[];
};

export function CorridorExposureChart({ affectedCorridorNames }: Props) {
  const data = useMemo(() => {
    const allCorridors = getAllNodesByType("corridor");
    
    return allCorridors.map((c) => {
      // Find if this corridor is affected by checking if any affected name matches its label or aliases
      const isAffected = affectedCorridorNames.some((ac) => 
        ac.toLowerCase() === c.label.toLowerCase() || 
        c.aliases?.some(alias => alias.toLowerCase() === ac.toLowerCase()) ||
        ac.toLowerCase().includes(c.label.toLowerCase())
      );

      return {
        name: c.label,
        capacity: c.capacityMtpa || 0,
        isAffected,
      };
    }).sort((a, b) => b.capacity - a.capacity); // Sort by capacity
  }, [affectedCorridorNames]);

  const totalAffected = data.filter(d => d.isAffected).reduce((sum, d) => sum + d.capacity, 0);
  const totalCapacity = data.reduce((sum, d) => sum + d.capacity, 0);
  const affectedPct = totalCapacity > 0 ? (totalAffected / totalCapacity) * 100 : 0;

  if (data.length === 0) return null;

  return (
    <div className="solid-card mt-4 rounded-xl border border-white/10 p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Global Chokepoint Exposure
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Comparing annual throughput capacity (Mtpa) of disrupted vs stable corridors.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-red-400 tabular-nums leading-none">
            {affectedPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            Global Capacity at Risk
          </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} 
              width={120}
            />
            <Tooltip 
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl">
                    <div className="font-semibold text-foreground mb-1 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${d.isAffected ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      {d.name}
                    </div>
                    <div className="text-muted-foreground">
                      Capacity: <span className="text-foreground font-bold">{d.capacity.toLocaleString()} Mtpa</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      Status: <span className={d.isAffected ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
                        {d.isAffected ? "Disrupted" : "Normal"}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="capacity" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isAffected ? "#f87171" : "rgba(255,255,255,0.15)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-[9px] text-muted-foreground/50 text-right">
        * Based on physical infrastructure throughput data from EIA, UNCTAD, and respective port authorities.
      </div>
    </div>
  );
}
