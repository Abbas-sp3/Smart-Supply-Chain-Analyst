import { KnowledgeGraphNode } from "@/features/geopolitical-intelligence/knowledge-graph/tradeGraph";
import { CrudeAlternative } from "@/features/procurement/data/alternativeSources";
import { ReserveConfig } from "@/features/scenario-simulator/constants/reserve-config";
import { DisruptionPreset } from "@/features/scenario-simulator/types";

export type ReserveMechanism = 
  | {
      type: "centralized_facilities";
      totalCoverDays: number;
      details: {
        facilities: { id: string; name: string; capacityMmt: number; state: string; fillPct: number }[];
        nationalFillPercent: number;
        currentFillMmt: number;
        policyNormDays: number;
      };
    }
  | {
      type: "mandated_stockholding";
      totalCoverDays: number;
      details: {
        licensedImporters: string[];
        minimumStockholdingDays: number;
        enforcementMechanism: string;
      };
    };

export interface CountryProfile {
  id: string;
  name: string;
  flag: string;                   // emoji flag, e.g. "🇮🇳"
  mapView: { center: [number, number]; zoom: number };
  
  // High-level dependency metrics
  baselineImportDependencyPct: number; 
  
  // Geography and routing specific to this country
  corridorFractions: Record<string, number>; // e.g. "corridor_hormuz": 0.22
  portCorridorFractions: Record<string, number>; // e.g. "port_mundra:corridor_hormuz": 0.55
  
  // Knowledge Graph
  tradeGraph: KnowledgeGraphNode[];
  
  // Scenarios/Events
  disruptionPresets: DisruptionPreset[];
  
  // Strategic Reserve Configuration
  reserveConfig: ReserveConfig;
  reserveMechanism: ReserveMechanism;
  commercialBufferMmt: number; // For the optimization engine
  
  // Alternative Sourcing Options
  defaultAlternativeSources: CrudeAlternative[];

  // ── Energy Profile (Command Center data) ──────────────────────────────────
  // Single source of truth for EnergySupplyOverview and ImportDependencyMetrics.
  // Add this block to any new country — zero UI changes required.
  energyProfile: {
    annualConsumptionMtpa: number;      // total energy consumed per year
    refiningCapacityMtpa: number;       // installed refining capacity
    currentUtilizationPct: number;      // current refinery utilization %
    importSharePct: number;             // % of energy that is imported (0-100)
    dataSource: string;                 // citation, e.g. "PPAC 2023-24"
    supplierMix: {
      commodity: string;               // "Crude" | "LNG" | "Coal" | etc.
      suppliers: { name: string; pct: number }[];  // must sum to 100
    }[];
  };
}
