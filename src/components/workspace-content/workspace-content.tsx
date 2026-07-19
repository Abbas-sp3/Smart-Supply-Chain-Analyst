"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { FloatingPanel } from "@/components/floating-panel";
import { NesiHero } from "@/components/command-center/NesiHero";
import { SmartSummary } from "@/components/command-center/SmartSummary";
import { EnergySupplyOverview } from "@/components/command-center/EnergySupplyOverview";
import { EnergyPriceMonitor } from "@/components/command-center/EnergyPriceMonitor";
import { EnergyCorridorWatch } from "@/components/command-center/EnergyCorridorWatch";
import { ImportDependencyMetrics } from "@/components/command-center/ImportDependencyMetrics";
import { calculateGrf, calculateSrf, calculateNesi, type NesiComponents, type AlertSeverity } from "@/lib/nesi";
import { ISPRL_CURRENT_STATE, ISPRL_TOTAL_CAPACITY_MMT } from "@/features/scenario-simulator/constants/reserve-config";

export function WorkspaceContent() {
  const [components, setComponents] = useState<NesiComponents | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadState() {
      // 1. Fetch live corridor statuses (source of truth for the top header)
      let alerts: any[] = [];
      try {
        const res = await fetch("/api/corridor-status");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.corridors)) {
            data.corridors.forEach((c: any) => {
              if (c.status === "CRITICAL") {
                alerts.push({ severity: "Critical", title: `${c.name} Disruption`, description: c.headline });
              } else if (c.status === "ELEVATED") {
                alerts.push({ severity: "High", title: `${c.name} Warning`, description: c.headline });
              }
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch corridor status for NESI", e);
      }

      setActiveAlerts(alerts);

      // 2. Compute GRF
      const grf = calculateGrf(alerts.map((a: any) => ({ severity: a.severity as AlertSeverity })));
      
      // 3. Compute SRF
      const srf = calculateSrf(ISPRL_CURRENT_STATE.currentFillMmt, ISPRL_TOTAL_CAPACITY_MMT);
      
      // 4. Compute ScRF (Baseline = 95)
      // Since there is no persisted scenario state yet, we use a strong baseline
      const scrf = 95; 

      setComponents(calculateNesi(grf, srf, scrf));
    }

    loadState();
  }, []);

  if (!components) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-white/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none h-full min-h-full p-4 sm:p-5 lg:p-6 overflow-y-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6 pointer-events-auto pb-20">
        
        {/* Top Hero Section */}
        <div className="flex flex-col gap-6">
          <div className="w-full">
            <NesiHero components={components} />
          </div>
          <div className="w-full">
            <SmartSummary components={components} activeAlerts={activeAlerts} />
          </div>
        </div>

        {/* 4 Panels Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <FloatingPanel title="Energy Supply Overview" className="min-h-[340px] h-full" noBorder>
            <EnergySupplyOverview />
          </FloatingPanel>
          
          <FloatingPanel title="Energy Price Monitor" className="min-h-[340px] h-full" noBorder>
            <EnergyPriceMonitor />
          </FloatingPanel>
          
          <FloatingPanel title="Energy Corridor Watch" className="min-h-[340px] h-full" noBorder>
            <EnergyCorridorWatch activeAlerts={activeAlerts} />
          </FloatingPanel>
          
          <FloatingPanel title="Import Dependency Metrics" className="min-h-[340px] h-full" noBorder>
            <ImportDependencyMetrics />
          </FloatingPanel>
          
        </div>

      </div>
    </motion.div>
  );
}
