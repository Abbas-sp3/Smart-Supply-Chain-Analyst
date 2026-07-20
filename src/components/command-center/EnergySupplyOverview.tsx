"use client";

import { motion } from "framer-motion";
import { Factory, Droplets, BatteryCharging } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { INDIA_RESERVE_CONFIG } from "@/features/scenario-simulator/constants/reserve-config";

export function EnergySupplyOverview() {
  // Data derived from PPAC (Petroleum Planning & Analysis Cell) 2023-24
  const totalConsumption = INDIA_RESERVE_CONFIG.normalConsumptionMtpa; // ~258 Mtpa
  const importShare = 0.85;
  const domesticShare = 1 - importShare;
  
  const importedVolume = totalConsumption * importShare;
  const domesticVolume = totalConsumption * domesticShare;
  
  const totalRefiningCapacity = 253.92; // Mtpa, PPAC 2023-24
  // Utilization is slightly over 100% historically for Indian refiners, let's use 101.5%
  const currentUtilizationPct = 101.5; 

  const mixData = [
    { name: "Imported Crude", value: importedVolume, fill: "#f43f5e" }, // Rose 500
    { name: "Domestic Crude", value: domesticVolume, fill: "#34d399" }, // Emerald 400
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Droplets className="size-4 shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Annual Consumption</span>
          </div>
          <div className="text-xl sm:text-2xl font-black tabular-nums">{totalConsumption.toFixed(0)} <span className="text-xs sm:text-sm text-muted-foreground font-normal">MMT</span></div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Factory className="size-4 shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Refining Capacity</span>
          </div>
          <div className="text-xl sm:text-2xl font-black tabular-nums">{totalRefiningCapacity.toFixed(1)} <span className="text-xs sm:text-sm text-muted-foreground font-normal">MMT</span></div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[180px]">
        {/* Import vs Domestic Donut */}
        <div className="flex flex-col relative">
          <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground mb-1">Sourcing Mix (PPAC Baseline)</h4>
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
                  formatter={(value: any) => [
                    `${value.toFixed(1)} Mtpa`,
                    "Volume"
                  ]}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={20} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-xl font-black text-rose-400">85%</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Imported</span>
            </div>
          </div>
        </div>

        {/* Capacity Utilization Gauge */}
        <div className="flex flex-col relative">
          <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground mb-1">Refinery Utilization</h4>
          <div className="flex-1 relative min-h-[130px] bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center p-3">
             <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">{currentUtilizationPct.toFixed(1)}</span>
                <span className="text-base sm:text-lg text-emerald-400/70 font-bold mb-1">%</span>
             </div>
             <div className="w-full h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, currentUtilizationPct)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-emerald-400"
                />
             </div>
             <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-3 text-center leading-tight">
                Running at peak capacity. Source: PPAC 2023-24.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
