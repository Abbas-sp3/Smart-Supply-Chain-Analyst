"use client";

import { motion } from "framer-motion";
import { Factory, Droplets } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useCountry } from "@/hooks/useCountry";

export function EnergySupplyOverview() {
  const { activeCountry } = useCountry();
  const ep = activeCountry.energyProfile;

  const importedVolume = ep.annualConsumptionMtpa * (ep.importSharePct / 100);
  const domesticVolume = ep.annualConsumptionMtpa * (1 - ep.importSharePct / 100);

  const mixData = [
    { name: "Imported", value: importedVolume, fill: "#f43f5e" },
    ...(domesticVolume > 0 ? [{ name: "Domestic", value: domesticVolume, fill: "#34d399" }] : []),
  ];

  const utilizationColor =
    ep.currentUtilizationPct >= 100 ? "text-amber-400" :
    ep.currentUtilizationPct >= 85  ? "text-emerald-400" :
                                       "text-blue-400";

  return (
    <div className="h-full flex flex-col gap-4">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Droplets className="size-4 shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Annual Consumption</span>
          </div>
          <div className="text-xl sm:text-2xl font-black tabular-nums">
            {ep.annualConsumptionMtpa.toFixed(0)}{" "}
            <span className="text-xs sm:text-sm text-muted-foreground font-normal">MMT</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Factory className="size-4 shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Refining Capacity</span>
          </div>
          <div className="text-xl sm:text-2xl font-black tabular-nums">
            {ep.refiningCapacityMtpa.toFixed(1)}{" "}
            <span className="text-xs sm:text-sm text-muted-foreground font-normal">MMT</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[180px]">
        {/* Import vs Domestic Donut */}
        <div className="flex flex-col relative">
          <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground mb-1">
            Sourcing Mix ({ep.dataSource})
          </h4>
          <div className="flex-1 relative min-h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mixData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="75%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {mixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value.toFixed(1)} Mtpa`, "Volume"]}
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", fontSize: "12px" }}
                  itemStyle={{ color: "#e4e4e7" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={20}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-xl font-black text-rose-400">{ep.importSharePct}%</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Imported</span>
            </div>
          </div>
        </div>

        {/* Capacity Utilization */}
        <div className="flex flex-col relative">
          <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground mb-1">Refinery Utilization</h4>
          <div className="flex-1 relative min-h-[130px] bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center p-3">
            <div className="flex items-end gap-2 mb-1">
              <span className={`text-3xl sm:text-4xl font-black ${utilizationColor}`}>
                {ep.currentUtilizationPct.toFixed(1)}
              </span>
              <span className={`text-base sm:text-lg font-bold mb-1 ${utilizationColor} opacity-70`}>%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ep.currentUtilizationPct)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full ${
                  ep.currentUtilizationPct >= 100 ? "bg-amber-400" :
                  ep.currentUtilizationPct >= 85  ? "bg-emerald-400" : "bg-blue-400"
                }`}
              />
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-3 text-center leading-tight">
              Source: {ep.dataSource}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
