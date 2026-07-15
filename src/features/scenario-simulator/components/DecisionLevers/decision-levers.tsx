"use client";

import { useState } from "react";
import { Sliders, RotateCcw, Play, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { INDIA_RESERVE_CONFIG } from "@/features/scenario-simulator/constants/reserve-config";
import type {
  DecisionLever,
  StrategicReserveReleaseLever,
  SpotCharterLever,
  SupplierSwitchLever,
} from "@/features/scenario-simulator/types";

// ─── Alternate supplier options ───────────────────────────────────────────────

const ALTERNATE_SUPPLIERS: {
  id: string;
  label: string;
  flag: string;
  corridorId: string;
  note: string;
}[] = [
  {
    id: "saudi_arabia",
    label: "Saudi Arabia",
    flag: "🇸🇦",
    corridorId: "corridor_hormuz",
    note: "Arab Light / Arab Medium — primary India supplier",
  },
  {
    id: "uae",
    label: "United Arab Emirates",
    flag: "🇦🇪",
    corridorId: "corridor_hormuz",
    note: "Murban crude — existing refinery compatibility",
  },
  {
    id: "russia",
    label: "Russia",
    flag: "🇷🇺",
    corridorId: "corridor_cape",
    note: "Urals / ESPO — discounted spot market, longer ETA via Cape",
  },
  {
    id: "iraq",
    label: "Iraq",
    flag: "🇮🇶",
    corridorId: "corridor_hormuz",
    note: "Basrah Light — India's largest single supplier (~25% of imports)",
  },
  {
    id: "usa",
    label: "United States",
    flag: "🇺🇸",
    corridorId: "corridor_cape",
    note: "WTI / Mars — longer transit via Cape, but stable supply",
  },
  {
    id: "brazil",
    label: "Brazil",
    flag: "🇧🇷",
    corridorId: "corridor_cape",
    note: "Lula crude — growing exports, Cape route, refinery compatible",
  },
  {
    id: "nigeria",
    label: "Nigeria",
    flag: "🇳🇬",
    corridorId: "corridor_cape",
    note: "Bonny Light — premium grade, Cape route",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeverState = {
  supplierSwitch: {
    enabled: boolean;
    fromCountryId: string;
    toCountryId: string;
    volumeMtpa: number;
  };
  spotCharter: {
    enabled: boolean;
    volumeMtpa: number;
    corridorId: string;
  };
  reserveRelease: {
    enabled: boolean;
    dailyRateMtpa: number;
    durationDays: number;
  };
};

export const DEFAULT_LEVER_STATE: LeverState = {
  supplierSwitch: {
    enabled: false,
    fromCountryId: "iraq",
    toCountryId: "brazil",
    volumeMtpa: 10,
  },
  spotCharter: {
    enabled: false,
    volumeMtpa: 5,
    corridorId: "corridor_cape",
  },
  reserveRelease: {
    enabled: false,
    dailyRateMtpa: INDIA_RESERVE_CONFIG.maxDailyDrawdownMtpa,
    durationDays: 14,
  },
};

export function buildLeversArray(state: LeverState): DecisionLever[] {
  const levers: DecisionLever[] = [];

  if (state.supplierSwitch.enabled) {
    const toSupplier = ALTERNATE_SUPPLIERS.find(
      (s) => s.id === state.supplierSwitch.toCountryId,
    );
    const lever: SupplierSwitchLever = {
      type: "supplier_switch",
      fromCountryId: state.supplierSwitch.fromCountryId,
      toCountryId: state.supplierSwitch.toCountryId,
      productId: "crude_oil",
      volumeMtpa: state.supplierSwitch.volumeMtpa,
    };
    levers.push(lever);
  }

  if (state.spotCharter.enabled) {
    const lever: SpotCharterLever = {
      type: "spot_charter",
      volumeMtpa: state.spotCharter.volumeMtpa,
      alternativeCorridorId: state.spotCharter.corridorId,
      productId: "crude_oil",
    };
    levers.push(lever);
  }

  if (state.reserveRelease.enabled) {
    const lever: StrategicReserveReleaseLever = {
      type: "strategic_reserve_release",
      dailyRateMtpa: Math.min(
        state.reserveRelease.dailyRateMtpa,
        INDIA_RESERVE_CONFIG.maxDailyDrawdownMtpa,
      ),
      durationDays: state.reserveRelease.durationDays,
    };
    levers.push(lever);
  }

  return levers;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LeverToggleRow({
  label,
  description,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        enabled
          ? "border-white/15 bg-white/[0.05]"
          : "border-white/8 bg-white/[0.02]",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={onToggle}
      >
        {/* Toggle pill */}
        <div
          className={cn(
            "relative h-5 w-9 flex-shrink-0 rounded-full border transition-colors duration-200",
            enabled
              ? "border-primary/40 bg-primary/20"
              : "border-white/15 bg-white/5",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200",
              enabled
                ? "left-4 bg-primary"
                : "left-0.5 bg-white/30",
            )}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        {enabled ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {enabled && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground/50">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Main DecisionLevers component ───────────────────────────────────────────

type DecisionLeversProps = {
  levers: LeverState;
  onChange: (levers: LeverState) => void;
  onApply: () => void;
  hasBaseline: boolean;
  loading: boolean;
};

export function DecisionLevers({
  levers,
  onChange,
  onApply,
  hasBaseline,
  loading,
}: DecisionLeversProps) {
  const activeCount = [
    levers.supplierSwitch.enabled,
    levers.spotCharter.enabled,
    levers.reserveRelease.enabled,
  ].filter(Boolean).length;

  const toSupplier = ALTERNATE_SUPPLIERS.find(
    (s) => s.id === levers.supplierSwitch.toCountryId,
  );

  const maxDailyMtpa = INDIA_RESERVE_CONFIG.maxDailyDrawdownMtpa;
  const maxDailyBblk = Math.round(maxDailyMtpa * 1e6 / 0.136 / 1000); // ~50k bbl/day

  return (
    <div className="glass-surface rounded-xl border border-white/10 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-muted-foreground" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Decision Levers
          </h3>
          {activeCount > 0 && (
            <span className="rounded border border-white/15 bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() =>
              onChange({
                supplierSwitch: { ...levers.supplierSwitch, enabled: false },
                spotCharter: { ...levers.spotCharter, enabled: false },
                reserveRelease: { ...levers.reserveRelease, enabled: false },
              })
            }
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3" />
            Clear all
          </button>
        )}
      </div>

      {!hasBaseline && (
        <p className="mb-4 text-xs text-muted-foreground/60 leading-relaxed">
          Run the baseline simulation first to establish reference metrics, then
          apply levers to see how each decision shifts the outcome.
        </p>
      )}

      <div className="space-y-2">
        {/* ── Supplier Switch ── */}
        <LeverToggleRow
          label="Supplier Switch"
          description={
            levers.supplierSwitch.enabled && toSupplier
              ? `${levers.supplierSwitch.volumeMtpa} Mtpa → ${toSupplier.flag} ${toSupplier.label}`
              : "Redirect crude imports to an alternate source country"
          }
          enabled={levers.supplierSwitch.enabled}
          onToggle={() =>
            onChange({
              ...levers,
              supplierSwitch: {
                ...levers.supplierSwitch,
                enabled: !levers.supplierSwitch.enabled,
              },
            })
          }
        >
          <FieldRow label="Alternate supplier">
            <div className="grid grid-cols-1 gap-1.5">
              {ALTERNATE_SUPPLIERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...levers,
                      supplierSwitch: {
                        ...levers.supplierSwitch,
                        toCountryId: s.id,
                        fromCountryId:
                          levers.supplierSwitch.fromCountryId === s.id
                            ? "iraq"
                            : levers.supplierSwitch.fromCountryId,
                      },
                    })
                  }
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                    levers.supplierSwitch.toCountryId === s.id
                      ? "border-white/20 bg-white/[0.07] text-foreground"
                      : "border-white/8 bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04]",
                  )}
                >
                  <span className="shrink-0 text-base leading-none">{s.flag}</span>
                  <span className="flex-1">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="ml-2 text-muted-foreground/70">{s.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </FieldRow>

          <FieldRow label="Volume to switch" hint={`${levers.supplierSwitch.volumeMtpa} Mtpa`}>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={levers.supplierSwitch.volumeMtpa}
              onChange={(e) =>
                onChange({
                  ...levers,
                  supplierSwitch: {
                    ...levers.supplierSwitch,
                    volumeMtpa: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-primary"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground/50">
              <span>1 Mtpa</span>
              <span>60 Mtpa</span>
            </div>
          </FieldRow>
        </LeverToggleRow>

        {/* ── Spot Charter ── */}
        <LeverToggleRow
          label="Spot Charter"
          description={
            levers.spotCharter.enabled
              ? `${levers.spotCharter.volumeMtpa} Mtpa via alternate corridor`
              : "Source additional volume via chartered vessels on an alternate route"
          }
          enabled={levers.spotCharter.enabled}
          onToggle={() =>
            onChange({
              ...levers,
              spotCharter: {
                ...levers.spotCharter,
                enabled: !levers.spotCharter.enabled,
              },
            })
          }
        >
          <FieldRow label="Charter volume" hint={`${levers.spotCharter.volumeMtpa} Mtpa`}>
            <input
              type="range"
              min={1}
              max={30}
              step={0.5}
              value={levers.spotCharter.volumeMtpa}
              onChange={(e) =>
                onChange({
                  ...levers,
                  spotCharter: {
                    ...levers.spotCharter,
                    volumeMtpa: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-primary"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground/50">
              <span>1 Mtpa</span>
              <span>30 Mtpa</span>
            </div>
          </FieldRow>
          <p className="text-xs text-muted-foreground/60">
            Vessels are assumed available on demand; charter rates will increase
            in proportion to the preset's spot freight penalty.
          </p>
        </LeverToggleRow>

        {/* ── Strategic Reserve Release ── */}
        <LeverToggleRow
          label="Strategic Reserve Release"
          description={
            levers.reserveRelease.enabled
              ? `${(levers.reserveRelease.dailyRateMtpa * 1e6 / 0.136 / 1000).toFixed(0)}k bbl/day for ${levers.reserveRelease.durationDays} days`
              : `SPR drawdown — max ${maxDailyBblk}k bbl/day, floor: ${INDIA_RESERVE_CONFIG.minReserveFloorDays} days cover`
          }
          enabled={levers.reserveRelease.enabled}
          onToggle={() =>
            onChange({
              ...levers,
              reserveRelease: {
                ...levers.reserveRelease,
                enabled: !levers.reserveRelease.enabled,
              },
            })
          }
        >
          <FieldRow
            label="Daily drawdown rate"
            hint={`${(levers.reserveRelease.dailyRateMtpa * 1e6 / 0.136 / 1000).toFixed(0)}k bbl/day`}
          >
            <input
              type="range"
              min={0.001}
              max={maxDailyMtpa}
              step={0.0005}
              value={levers.reserveRelease.dailyRateMtpa}
              onChange={(e) =>
                onChange({
                  ...levers,
                  reserveRelease: {
                    ...levers.reserveRelease,
                    dailyRateMtpa: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-primary"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground/50">
              <span>~7k bbl/day</span>
              <span>~{maxDailyBblk}k bbl/day (max)</span>
            </div>
          </FieldRow>

          <FieldRow label="Duration" hint={`${levers.reserveRelease.durationDays} days`}>
            <input
              type="range"
              min={1}
              max={44}
              step={1}
              value={levers.reserveRelease.durationDays}
              onChange={(e) =>
                onChange({
                  ...levers,
                  reserveRelease: {
                    ...levers.reserveRelease,
                    durationDays: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-primary"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground/50">
              <span>1 day</span>
              <span>44 days (floor-limited)</span>
            </div>
          </FieldRow>

          <p className="text-xs text-muted-foreground/60">
            Engine enforces the {INDIA_RESERVE_CONFIG.minReserveFloorDays}-day
            policy floor — drawdown halts automatically before reserves reach
            that level regardless of duration set.
          </p>
        </LeverToggleRow>
      </div>

      {/* Apply button */}
      {hasBaseline && (
        <motion.button
          type="button"
          onClick={onApply}
          disabled={loading || activeCount === 0}
          whileHover={!loading && activeCount > 0 ? { scale: 1.01 } : {}}
          whileTap={!loading && activeCount > 0 ? { scale: 0.99 } : {}}
          className={cn(
            "mt-4 w-full rounded-xl border px-5 py-3 text-sm font-semibold uppercase tracking-wider transition-all",
            activeCount > 0
              ? "border-white/15 bg-white/[0.06] text-foreground hover:bg-white/[0.09]"
              : "border-white/8 bg-white/[0.02] text-muted-foreground/40 cursor-not-allowed",
            "flex items-center justify-center gap-2",
          )}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="size-4 rounded-full border-2 border-white/20 border-t-white/70"
              />
              Recomputing…
            </>
          ) : (
            <>
              <Play className="size-4" />
              Apply{activeCount > 0 ? ` ${activeCount} lever${activeCount > 1 ? "s" : ""}` : " levers"} &amp; recompute
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}
