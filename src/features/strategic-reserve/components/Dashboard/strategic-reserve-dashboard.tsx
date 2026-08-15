"use client";

import { useState } from "react";
import { useSimulation } from "@/features/scenario-simulator/hooks/useSimulation";
import { OptimizationResultsPanel } from "@/features/strategic-reserve/components/OptimizationEngine/optimization-results-panel";
import { SprFillGauge } from "@/features/strategic-reserve/components/charts/SprFillGauge";
import { MandatedStockholdingPanel } from "@/features/strategic-reserve/components/charts/MandatedStockholdingPanel";
import { MarketContext } from "./market-context";
import { useCountry } from "@/hooks/useCountry";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { CATEGORY_META, SEVERITY_COLOR } from "@/features/scenario-simulator/constants/ui-constants";
import { Clock, Ship, TrendingUp, Play, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function StrategicReserveDashboard() {
  const { baseline, loading, error, runBaseline } = useSimulation();
  const { activeCountry } = useCountry();

  // Use country's own preset list; fall back to global list if empty
  const countryPresets =
    activeCountry.disruptionPresets?.length > 0
      ? activeCountry.disruptionPresets
      : DISRUPTION_PRESETS;

  const defaultPresetId = countryPresets[0]?.id ?? DISRUPTION_PRESETS[0].id;
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPresetId);

  // When country changes, reset to that country's default preset
  const effectivePresetId = countryPresets.find((p) => p.id === selectedPresetId)
    ? selectedPresetId
    : defaultPresetId;

  const mechanism = activeCountry.reserveMechanism;
  const isCentralized = mechanism.type === "centralized_facilities";

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-transparent">
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
        <MarketContext />

        {/* Reserve status section — branches on mechanism type */}
        <div>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              {isCentralized
                ? "Strategic Petroleum Reserves — Centralized Facilities"
                : `${activeCountry.name} — Mandatory Stockholding Regime`}
            </h2>
          </div>

          {isCentralized ? (
            <SprFillGauge />
          ) : (
            <MandatedStockholdingPanel
              country={{ name: activeCountry.name }}
              mechanism={mechanism as Extract<typeof mechanism, { type: "mandated_stockholding" }>}
            />
          )}
        </div>

        {/* Scenario Selector */}
        <div className="pt-6">
          {!baseline ? (
            <div className="solid-card rounded-xl border border-white/10 p-6 space-y-5">
              <div>
                <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-foreground">
                  Select Disruption Scenario
                </h2>
                <p className="text-xs text-muted-foreground/60">
                  Run a scenario to analyze supply gaps and calculate strategic reserve optimization.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {countryPresets.map((preset) => {
                  const meta = CATEGORY_META[preset.category] ?? CATEGORY_META.multi_sector;
                  const isSelected = preset.id === effectivePresetId;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 border-l-4 card-hover",
                        meta.border,
                        isSelected
                          ? "border-y-white/20 border-r-white/20 bg-[#10151d]"
                          : "border-y-white/8 border-r-white/8 bg-[#0e1319] hover:bg-[#10151d]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className={cn("mb-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", meta.badge)}>
                            <meta.icon className="size-3" aria-hidden />
                            {meta.label}
                          </span>
                          <h3 className="mt-1 text-sm font-semibold leading-tight text-foreground">
                            {preset.label}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {preset.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={cn("text-lg font-bold tabular-nums", SEVERITY_COLOR(preset.severityPct))}>
                            {preset.severityPct}%
                          </div>
                          <div className="text-xs text-muted-foreground">severity</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />~{preset.expectedDurationDays}d
                        </span>
                        <span className="flex items-center gap-1">
                          <Ship className="size-3" />{preset.affectedNodeIds.length} nodes
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="size-3" />+{preset.spotFreightPenaltyPct}% freight
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <motion.button
                type="button"
                onClick={() => runBaseline(effectivePresetId)}
                disabled={loading}
                whileHover={!loading ? { scale: 1.005 } : {}}
                whileTap={!loading ? { scale: 0.995 } : {}}
                className="btn-primary-cta flex w-full items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="size-4 rounded-full border-2 border-white/20 border-t-white/70"
                    />
                    Running propagation engine…
                  </>
                ) : (
                  <>
                    <Play className="size-4" aria-hidden />
                    Run baseline simulation
                  </>
                )}
              </motion.button>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <OptimizationResultsPanel result={baseline.result} />
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary-cta flex items-center gap-2"
                >
                  Clear Results &amp; Run New Scenario
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
