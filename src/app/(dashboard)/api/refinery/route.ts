import { NextRequest, NextResponse } from "next/server";
import {
  INDIA_REFINERIES,
  DISRUPTION_SCENARIOS,
  CRUDE_GRADES,
  NATIONAL_TOTAL_CAPACITY_MMTPA,
  NATIONAL_REFINERY_COUNT,
  DATA_SOURCE_NOTE,
  getRegionForState,
} from "@/features/refinery/constants";
import type {
  RefineryWithStatus,
  RefineryCluster,
  DisruptionImpact,
  RefineryDashboardData,
} from "@/features/refinery/types";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: RefineryDashboardData | null = null;
let cachedAt = 0;

const STATE_CRUDE_affinity: Record<string, string[]> = {
  Gujarat: ["Arab Light", "Arab Heavy", "Basrah Light", "Urals", "ESPO", "Bonny Light", "Upper Zakum", "Murban", "Das"],
  Maharashtra: ["Arab Light", "Arab Heavy", "Basrah Light", "Iranian Heavy", "Bonny Light", "Urals"],
  Karnataka: ["Arab Light", "Arab Heavy", "Basrah Light", "Urals", "ESPO", "Mars", "Bonny Light"],
  Kerala: ["Arab Light", "Arab Heavy", "Basrah Light", "Bonny Light", "ESPO", "Urals"],
  Odisha: ["Arab Light", "Basrah Light", "Bonny Light", "ESPO", "WTI Midland", "Urals"],
  "Andhra Pradesh": ["Arab Light", "Basrah Light", "Bonny Light", "Urals", "ESPO", "Das"],
  "West Bengal": ["Arab Light", "Bonny Light", "ESPO", "Urals", "Basrah Light"],
  "Uttar Pradesh": ["Arab Light", "Basrah Light", "Urals", "Bonny Light"],
  Haryana: ["Arab Light", "Basrah Light", "Urals", "ESPO", "Bonny Light"],
  "Madhya Pradesh": ["Arab Light", "Basrah Light", "Urals", "Bonny Light"],
  Punjab: ["Arab Light", "Basrah Light", "Urals", "ESPO"],
  "Tamil Nadu": ["Arab Light", "Basrah Light", "Bonny Light", "Urals", "Murban", "Das"],
  Assam: ["Bonny Light", "ESPO", "Urals", "WTI Midland"],
  Bihar: ["Arab Light", "Basrah Light", "Bonny Light", "Urals"],
};

const TYPICAL_PRODUCTS = [
  { name: "Diesel", pctOfOutput: 44 },
  { name: "Petrol (MS)", pctOfOutput: 21 },
  { name: "Kerosene / ATF", pctOfOutput: 13 },
  { name: "LPG", pctOfOutput: 10 },
  { name: "Furnace Oil / LSHS", pctOfOutput: 6 },
  { name: "Bitumen / Petrochemicals", pctOfOutput: 6 },
];

function enrichRefinery(r: (typeof INDIA_REFINERIES)[number]): RefineryWithStatus {
  const age = new Date().getFullYear() - new Date(r.commissioned).getFullYear();
  const status = r.expandingToMMTPA ? "expanding" : age > 60 ? "legacy" : "operational";
  const region = getRegionForState(r.state) as "west" | "north" | "east" | "south" | "northeast";
  const utilization = r.expandingToMMTPA ? 88 : Math.min(105, 85 + Math.round(r.nelsonComplexityIndex ?? 8));
  const buffer = region === "west" ? 21 : region === "northeast" ? 25 : 16;

  return {
    ...r,
    id: r.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    status,
    region,
    utilizationPct: utilization,
    crudeGrades: STATE_CRUDE_affinity[r.state] ?? ["Arab Light", "Bonny Light"],
    products: TYPICAL_PRODUCTS,
    bufferDays: buffer,
  };
}

function buildDashboard(): RefineryDashboardData {
  const refineries = INDIA_REFINERIES.map(enrichRefinery);

  const regionOrder = ["west", "south", "east", "north", "northeast"] as const;
  const regionLabels: Record<string, string> = {
    west: "West Coast",
    south: "South India",
    east: "East & Northeast",
    north: "North India",
    northeast: "Northeast India",
  };

  const clusters: RefineryCluster[] = regionOrder
    .filter((r) => refineries.some((ref) => ref.region === r))
    .map((region) => {
      const refineriesInRegion = refineries.filter((r) => r.region === region);
      return {
        region,
        label: regionLabels[region] ?? region,
        refineries: refineriesInRegion,
        totalCapacityMMTPA: Math.round(refineriesInRegion.reduce((s, r) => s + r.capacityMMTPA, 0) * 10) / 10,
      };
    });

  const nciValues = refineries.map((r) => r.nelsonComplexityIndex).filter((n): n is number => n !== null);
  const avgNelsonComplexity = Math.round((nciValues.reduce((s, n) => s + n, 0) / nciValues.length) * 10) / 10;

  return {
    refineries,
    clusters,
    nationalStats: {
      totalCapacityMMTPA: Math.round(NATIONAL_TOTAL_CAPACITY_MMTPA * 10) / 10,
      operationalCount: refineries.filter((r) => r.status === "operational").length,
      expandingCount: refineries.filter((r) => r.status === "expanding").length,
      totalRefineries: NATIONAL_REFINERY_COUNT,
      avgNelsonComplexity,
    },
    crudeCompatibility: {
      grades: CRUDE_GRADES,
      matrix: Object.fromEntries(refineries.map((r) => [r.name, r.crudeGrades])),
    },
    scenarios: DISRUPTION_SCENARIOS,
    dataSource: DATA_SOURCE_NOTE,
  };
}

function simulateImpact(scenarioId: string): DisruptionImpact | null {
  const scenario = DISRUPTION_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return null;

  const affected = INDIA_REFINERIES.filter((r) =>
    scenario.affectedRefineryNames.includes(r.name),
  );
  const totalLost = affected.reduce(
    (s, r) => s + r.capacityMMTPA * (scenario.severityImpactPct / 100), 0,
  );
  const nationalAfter = NATIONAL_TOTAL_CAPACITY_MMTPA - totalLost;
  const supplyGap = (totalLost / NATIONAL_TOTAL_CAPACITY_MMTPA) * 100;
  const fuelShortageDays = Math.round(scenario.durationDays * (supplyGap / 100) * 3);
  const priceImpact = Math.round(supplyGap * 2.5 * 10) / 10;

  const productShortages: Record<string, number> = {};
  for (const r of affected) {
    const lost = r.capacityMMTPA * (scenario.severityImpactPct / 100);
    for (const p of TYPICAL_PRODUCTS) {
      const lostProduct = lost * (p.pctOfOutput / 100);
      productShortages[p.name] = (productShortages[p.name] ?? 0) + lostProduct;
    }
  }

  const affectedProducts = Object.entries(productShortages)
    .map(([name, volume]) => ({
      name,
      shortagePct: Math.round((volume / (NATIONAL_TOTAL_CAPACITY_MMTPA * 0.35)) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.shortagePct - a.shortagePct);

  return {
    scenarioId: scenario.id,
    affectedRefineries: affected.map((r) => ({
      name: r.name,
      lostCapacityMMTPA: Math.round(r.capacityMMTPA * (scenario.severityImpactPct / 100) * 10) / 10,
    })),
    totalLostCapacityMMTPA: Math.round(totalLost * 10) / 10,
    nationalCapacityAfter: Math.round(nationalAfter * 10) / 10,
    supplyGapPct: Math.round(supplyGap * 10) / 10,
    fuelShortageDays,
    estimatedPriceImpactPct: priceImpact,
    affectedProducts,
  };
}

export async function GET(request: NextRequest) {
  const scenarioId = request.nextUrl.searchParams.get("scenario");

  if (scenarioId) {
    const impact = simulateImpact(scenarioId);
    if (!impact) return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
    return NextResponse.json({ impact }, { status: 200 });
  }

  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ data: cached, cached: true }, { status: 200 });
  }

  const data = buildDashboard();
  cached = data;
  cachedAt = Date.now();

  return NextResponse.json({ data }, { status: 200 });
}
