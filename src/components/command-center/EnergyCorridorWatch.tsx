"use client";

import { Navigation, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import type { AlertSeverity } from "@/lib/nesi";
import { useCountry } from "@/hooks/useCountry";

export function EnergyCorridorWatch({ activeAlerts }: { activeAlerts: any[] }) {
  const { activeCountry } = useCountry();

  // Get chokepoints from the active country's presets (those with mapCoordinates)
  const chokepoints = activeCountry.disruptionPresets
    .filter(preset => preset.mapCoordinates)
    .map(preset => {
      const presetName = (preset as any).name || (preset as any).label || "";
      const affectedNode = preset.affectedNodeIds?.[0] || "";
      return {
        id: preset.id,
        name: presetName.replace(" Complete Blockade", "").split(" —")[0], // clean up name for display (handle both "Strait of Hormuz — Partial Closure" and "Malacca Complete Blockade")
        keywords: [affectedNode.replace("corridor_", "")], // simple heuristic
        coordinates: preset.mapCoordinates,
      };
    });

  const getSeverity = (cp: typeof chokepoints[0]): AlertSeverity | null => {
    const alert = activeAlerts.find(a => {
      const title = (a.title ?? "").toLowerCase();
      const desc  = (a.description ?? "").toLowerCase();
      return cp.keywords.some(kw => title.includes(kw) || desc.includes(kw));
    });
    return alert ? alert.severity : null;
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center gap-2 mb-3 px-1 z-10">
        <Navigation className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategic Chokepoints</span>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden border border-white/5 min-h-[220px] bg-black/20 p-2 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {chokepoints.map((cp) => {
            const severity = getSeverity(cp);
            
            // Mirror color logic
            const colorClass =
              severity === "Critical" ? "text-red-400 bg-red-400/10 border-red-400/20" :
              severity === "High"     ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
              severity === "Medium"   ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" :
                                        "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
                                        
            const dotClass =
              severity === "Critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" :
              severity === "High"     ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" :
              severity === "Medium"   ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" :
                                        "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]";

            const Icon = severity === "Critical" || severity === "High" ? AlertTriangle : 
                         severity === "Medium" ? Activity : ShieldCheck;

            return (
              <div 
                key={cp.id}
                className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`size-2.5 rounded-full ${dotClass} ${severity === 'Critical' ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-medium text-white/90">{cp.name}</span>
                </div>
                
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colorClass}`}>
                  <Icon className="size-3" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">
                    {severity || "Normal"}
                  </span>
                </div>
              </div>
            );
          })}
          
          {chokepoints.length === 0 && (
             <div className="text-center text-sm text-muted-foreground p-4">
               No strategic chokepoints defined for {activeCountry.name}.
             </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between mt-3 px-2 text-[9px] uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="size-2 bg-emerald-500 rounded-full" /> Normal</div>
        <div className="flex items-center gap-1.5"><div className="size-2 bg-yellow-500 rounded-full" /> Medium</div>
        <div className="flex items-center gap-1.5"><div className="size-2 bg-amber-500 rounded-full" /> High</div>
        <div className="flex items-center gap-1.5"><div className="size-2 bg-red-500 rounded-full" /> Critical</div>
      </div>
      
      <div className="mt-2 px-2 text-[10px] text-muted-foreground text-center italic">
        See main map for live locations
      </div>
    </div>
  );
}
