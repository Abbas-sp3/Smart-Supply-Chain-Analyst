"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Info } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import type { NesiComponents } from "@/lib/nesi";

interface NesiHeroProps {
  components: NesiComponents;
}

function ComponentGauge({ label, value, fill, tooltip }: { label: string; value: number; fill: string; tooltip: string }) {
  const data = [{ value, fill }];
  
  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-black/20 rounded-xl border border-white/5 relative group">
      <div className="absolute top-2 right-2 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors cursor-help">
        <Info className="size-3" />
        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-[10px] text-muted-foreground rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 text-left">
          {tooltip}
        </div>
      </div>
      
      <div className="h-20 w-20 sm:h-24 sm:w-24 relative mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={6}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'rgba(255, 255, 255, 0.05)' }} dataKey="value" cornerRadius={3} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
          <span className="text-lg sm:text-xl font-bold font-mono tracking-tighter">{value}</span>
        </div>
      </div>
      <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center flex-1 flex items-center justify-center leading-tight">
        {label}
      </span>
    </div>
  );
}

export function NesiHero({ components }: NesiHeroProps) {
  const { nesi, grf, srf, scrf } = components;
  
  const nesiColor = nesi >= 80 ? "text-emerald-400" : nesi >= 60 ? "text-amber-400" : "text-red-400";
  const nesiBg = nesi >= 80 ? "from-emerald-500/20" : nesi >= 60 ? "from-amber-500/20" : "from-red-500/20";
  const nesiFill = nesi >= 80 ? "#34d399" : nesi >= 60 ? "#fbbf24" : "#f87171";

  const nesiData = [{ value: nesi, fill: nesiFill }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="solid-card rounded-2xl border border-white/10 overflow-hidden relative"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${nesiBg} to-transparent opacity-30`} />
      
      <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8">
        
        {/* Main NESI Score */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="h-48 w-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="100%"
                barSize={10}
                data={nesiData}
                startAngle={220}
                endAngle={-40}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'rgba(255, 255, 255, 0.05)' }} dataKey="value" cornerRadius={5} />
              </RadialBarChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
              <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Index
              </span>
              <span className={`text-6xl font-black font-mono tracking-tighter ${nesiColor} drop-shadow-lg`}>
                {nesi}
              </span>
              <span className="text-[10px] text-muted-foreground/60 mt-1 uppercase">/ 100</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold text-foreground">National Energy Security Index</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px] leading-relaxed">
              Real-time composite resilience score
            </p>
          </div>
        </div>

        {/* Breakdown Factors */}
        <div className="flex-1 w-full grid grid-cols-3 gap-4">
          <ComponentGauge 
            label="Geopolitical Resilience" 
            value={grf} 
            fill="#818cf8" 
            tooltip="Base 100 minus illustrative penalty points per active alert (Critical -15, High -10, Medium -5, Low -2). These are illustrative modeling parameters, not official doctrine."
          />
          <ComponentGauge 
            label="Strategic Reserve" 
            value={srf} 
            fill="#34d399" 
            tooltip="ISPRL Phase 1 current fill level percentage. As of mid-2026 baseline (PPAC consensus estimate)."
          />
          <ComponentGauge 
            label="Scenario Resilience" 
            value={scrf} 
            fill="#fbbf24" 
            tooltip="Supply Security Index (SSI) of the baseline system state, assuming no active disruptions."
          />
        </div>
        
      </div>
      
      {/* Honesty Disclosure Banner */}
      <div className="bg-black/40 border-t border-white/5 py-2 px-6 flex items-start sm:items-center gap-3">
        <ShieldAlert className="size-4 text-amber-500/70 shrink-0 mt-0.5 sm:mt-0" />
        <p className="text-[11px] text-muted-foreground/70 leading-tight">
          <strong>Methodology Disclosure:</strong> NESI is a deterministic composite of GRF (35%), SRF (35%), and ScRF (30%). GRF penalty values are illustrative modeling parameters. SRF reflects a static mid-2026 PPAC baseline, not a real-time feed.
        </p>
      </div>
    </motion.div>
  );
}
