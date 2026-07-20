"use client";

import { useState } from "react";
import { useSimulation } from "@/features/scenario-simulator/hooks/useSimulation";
import { DisruptionPresetSelector } from "@/features/scenario-simulator/components/DisruptionPresetSelector/disruption-preset-selector";
import { OptimizationResultsPanel } from "@/features/strategic-reserve/components/OptimizationEngine/optimization-results-panel";
import { SprFillGauge } from "@/features/strategic-reserve/components/charts/SprFillGauge";
import { MarketContext } from "./market-context";
import { Globe2, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants/app";

export function StrategicReserveDashboard() {
  const { baseline, loading, error, runBaseline } = useSimulation();
  const [selectedPresetId, setSelectedPresetId] = useState<string>("hormuz_closure_30d");

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-transparent">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10">
              <Globe2 className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <h1 className="text-sm font-semibold uppercase tracking-widest text-foreground">
                Energy Reserves
              </h1>
              <p className="text-sm text-muted-foreground">
                Strategic Reserve Optimization & Drawdown Planning
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
        <MarketContext />

        {/* SPR facility radial gauges */}
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                ISPRL Phase I Facilities
              </h2>
            </div>
          </div>
          <SprFillGauge />
        </div>

        <div className="pt-6">
          {!baseline ? (
            <div className="solid-card rounded-xl border border-white/10 p-6">
              <DisruptionPresetSelector
                title="Select Disruption Scenario"
                description="Run a scenario to analyze supply gaps and calculate strategic reserve optimization."
                selectedPresetId={selectedPresetId}
                onPresetChange={setSelectedPresetId}
                onRunBaseline={() => runBaseline(selectedPresetId)}
                loading={loading}
                hasBaseline={baseline !== null}
                error={error}
              />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <OptimizationResultsPanel result={baseline.result} />
              
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary-cta flex items-center gap-2"
                >
                  Clear Results & Run New Scenario
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
