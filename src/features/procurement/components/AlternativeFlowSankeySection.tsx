"use client";

import { useCountry } from "@/hooks/useCountry";
import { EnergyFlowSankey } from "@/features/analytics/components/EnergyFlowSankey";
import type { SankeyData } from "@/features/analytics/components/EnergyFlowSankey";
import { BarChart3, Navigation } from "lucide-react";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

// Dummy data for Alternative Sourcing Routes.
// We model it as: Origin -> Route -> Destination
const INDIA_ALT_DATA: SankeyData = {
  unit: "M bbl/day",
  nodes: [
    // Origins
    { name: "USA" },
    { name: "Brazil" },
    { name: "Guyana" },
    { name: "Nigeria" },
    { name: "Norway" },
    // Routes (Middle nodes)
    { name: "Cape of Good Hope" },
    { name: "Trans-Pacific Route" },
    { name: "Suez Canal (Escorted)" },
    // Destinations
    { name: "Mundra Port" },
    { name: "Kochi Port" },
    { name: "Paradip Port" },
  ],
  links: [
    { source: 0, target: 5, value: 0.8 }, // USA -> Cape
    { source: 1, target: 5, value: 0.6 }, // Brazil -> Cape
    { source: 2, target: 5, value: 0.4 }, // Guyana -> Cape
    { source: 3, target: 5, value: 0.9 }, // Nigeria -> Cape
    { source: 4, target: 7, value: 0.5 }, // Norway -> Suez
    { source: 0, target: 6, value: 0.3 }, // USA -> Trans-Pacific (via Malacca)
    
    { source: 5, target: 8, value: 1.5 }, // Cape -> Mundra
    { source: 5, target: 9, value: 0.8 }, // Cape -> Kochi
    { source: 5, target: 10, value: 0.4 }, // Cape -> Paradip
    
    { source: 7, target: 8, value: 0.3 }, // Suez -> Mundra
    { source: 7, target: 9, value: 0.2 }, // Suez -> Kochi
    
    { source: 6, target: 10, value: 0.3 }, // Trans-Pacific -> Paradip
  ]
};

const SG_ALT_DATA: SankeyData = {
  unit: "M bbl/day",
  nodes: [
    // Origins
    { name: "USA" },
    { name: "Brazil" },
    { name: "Nigeria" },
    { name: "Angola" },
    { name: "Australia" },
    // Routes
    { name: "Cape of Good Hope" },
    { name: "Trans-Pacific Route" },
    { name: "Sunda Strait" },
    // Destinations
    { name: "Jurong Island" },
    { name: "Pulau Bukom" },
  ],
  links: [
    { source: 0, target: 6, value: 0.8 },
    { source: 1, target: 5, value: 0.5 },
    { source: 2, target: 5, value: 0.6 },
    { source: 3, target: 5, value: 0.4 },
    { source: 4, target: 7, value: 0.9 }, // Australia -> Sunda
    
    { source: 5, target: 8, value: 1.0 },
    { source: 5, target: 9, value: 0.5 },
    
    { source: 6, target: 8, value: 0.5 },
    { source: 6, target: 9, value: 0.3 },
    
    { source: 7, target: 8, value: 0.6 },
    { source: 7, target: 9, value: 0.3 },
  ]
};

export function AlternativeFlowSankeySection() {
  const { activeCountry } = useCountry();
  const isSingapore = activeCountry.id === "singapore";
  const data = isSingapore ? SG_ALT_DATA : INDIA_ALT_DATA;

  return (
    <div className="glass-surface rounded-xl border border-white/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Navigation aria-hidden className="size-4 text-muted-foreground" />
        <p className="text-sm font-bold uppercase tracking-widest text-foreground">
          Alternative Sourcing Routes
        </p>
        <ProvenanceBadge kind="ai-estimate" />
      </div>
      <p className="mb-4 text-sm text-muted-foreground/80">
        Simulated contingency flows bypassing primary chokepoints. Visualises capacity routing from Western Hemisphere and West African suppliers via alternative maritime corridors (e.g., Cape of Good Hope, Trans-Pacific).
      </p>
      
      {/* 
        Sankey requires a fixed/min height to render properly. 
        We use a wrapper div with the same background style as the dashboard 
        to match the dark theme and contain the SVG. 
      */}
      <div className="relative h-[500px] w-full overflow-hidden rounded-lg border border-white/5 bg-[#0b0f1a] shadow-inner">
        <EnergyFlowSankey data={data} />
      </div>
      
      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground/60">
        <p>Values represent simulated maximum flow capacity (Millions of barrels per day).</p>
        <p>Interactive: Drag nodes to reorder routes.</p>
      </div>
    </div>
  );
}
