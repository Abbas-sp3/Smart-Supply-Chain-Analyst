"use client";

import { useCountry } from "@/hooks/useCountry";
import { EnergyRiskCompare, type CompareRadarSeries } from "../EnergyRiskCompare";
import { EnergyMarketIntelView, type EnergyMarketIntel } from "../EnergyMarketIntel";

// ── Dummy data for Energy Risk Compare ──
const COMPARE_DATA: CompareRadarSeries[] = [
  {
    entity: "Saudi Arabia",
    color: "#38bdf8",
    axes: [
      { axis: "Supply Gap", value: 30 },
      { axis: "Freight Risk", value: 85 },
      { axis: "Insurance Cost", value: 65 },
      { axis: "Geopolitical SSI", value: 75 },
      { axis: "Infrastructure", value: 20 },
      { axis: "Price Volatility", value: 45 },
    ],
  },
  {
    entity: "Iraq",
    color: "#f43f5e",
    axes: [
      { axis: "Supply Gap", value: 50 },
      { axis: "Freight Risk", value: 85 },
      { axis: "Insurance Cost", value: 80 },
      { axis: "Geopolitical SSI", value: 90 },
      { axis: "Infrastructure", value: 60 },
      { axis: "Price Volatility", value: 55 },
    ],
  },
  {
    entity: "Russia",
    color: "#a855f7",
    axes: [
      { axis: "Supply Gap", value: 20 },
      { axis: "Freight Risk", value: 95 },
      { axis: "Insurance Cost", value: 95 },
      { axis: "Geopolitical SSI", value: 85 },
      { axis: "Infrastructure", value: 40 },
      { axis: "Price Volatility", value: 75 },
    ],
  },
  {
    entity: "USA",
    color: "#10b981",
    axes: [
      { axis: "Supply Gap", value: 10 },
      { axis: "Freight Risk", value: 15 },
      { axis: "Insurance Cost", value: 10 },
      { axis: "Geopolitical SSI", value: 25 },
      { axis: "Infrastructure", value: 15 },
      { axis: "Price Volatility", value: 35 },
    ],
  },
  {
    entity: "Sector Benchmark",
    color: "#94a3b8",
    axes: [
      { axis: "Supply Gap", value: 45 },
      { axis: "Freight Risk", value: 55 },
      { axis: "Insurance Cost", value: 50 },
      { axis: "Geopolitical SSI", value: 60 },
      { axis: "Infrastructure", value: 40 },
      { axis: "Price Volatility", value: 50 },
    ],
  },
];

// ── Dummy data for Energy Market Intel ──
const INTEL_DATA: EnergyMarketIntel = {
  marketSnapshot: {
    totalMarketCap: "$14.2T",
    tracked: 120,
    avgYtdPct: 4.2,
    advancers: 78,
    decliners: 42,
    top3ConcentrationPct: 45, // Saudi Aramco, Exxon, Chevron
    topGainers: [
      { id: "XOM", ticker: "XOM", changePct: 2.1 },
      { id: "CVX", ticker: "CVX", changePct: 1.8 },
      { id: "SHEL", ticker: "SHEL", changePct: 1.5 },
    ],
    topLosers: [
      { id: "BP", ticker: "BP", changePct: -1.2 },
      { id: "TTE", ticker: "TTE", changePct: -0.8 },
      { id: "EQNR", ticker: "EQNR", changePct: -0.5 },
    ],
    leaders: [
      { id: "ARAMCO", name: "Saudi Aramco", ticker: "2222.SR", marketCap: "$2.1T", capSharePct: 14.8 },
      { id: "XOM", name: "ExxonMobil", ticker: "XOM", marketCap: "$450B", capSharePct: 3.2 },
      { id: "CVX", name: "Chevron", ticker: "CVX", marketCap: "$280B", capSharePct: 2.0 },
    ],
  },
  inventoryRatio: [
    { period: "Jan", value: 85 },
    { period: "Feb", value: 84 },
    { period: "Mar", value: 82 },
    { period: "Apr", value: 79 },
    { period: "May", value: 76 },
    { period: "Jun", value: 75 },
    { period: "Jul", value: 72 }, // Trending down = tighter market
  ],
  leadTimes: [
    { component: "VLCC Charter (AG → Asia)", weeks: 5, delta: +2 },
    { component: "Suezmax Charter", weeks: 4, delta: +1 },
    { component: "Aframax Charter", weeks: 3, delta: 0 },
    { component: "Refinery Turnaround", weeks: 8, delta: -1 },
  ],
  utilization: [
    { segment: "US Gulf Coast Refineries", pct: 94.2 },
    { segment: "European Refineries", pct: 81.5 },
    { segment: "Asian Refineries", pct: 88.7 },
    { segment: "Global Average", pct: 86.4 },
  ],
};

export function EnergyHorusWidgets() {
  const { activeCountry } = useCountry();
  return (
    <div className="space-y-6">
      <section aria-labelledby="energy-market-intel-heading">
        <h2 id="energy-market-intel-heading" className="sr-only">Energy Market Intel</h2>
        <EnergyMarketIntelView intel={INTEL_DATA} />
      </section>

      <section aria-labelledby="energy-risk-compare-heading">
        <h2 id="energy-risk-compare-heading" className="sr-only">Energy Risk Compare</h2>
        <EnergyRiskCompare compareRadar={COMPARE_DATA} />
      </section>
    </div>
  );
}
