"use client";

import { useMemo } from "react";
import { Award, Clock, DollarSign, Anchor, Beaker, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";
import { rankAlternatives, SCORING_WEIGHTS } from "../services/scoringEngine";
import type { ScoredAlternative } from "../services/scoringEngine";

// ── Helpers ───────────────────────────────────────────────────────────────────

function priceDiffLabel(diff: number): string {
  if (diff === 0) return "At Brent";
  return diff > 0 ? `+$${diff}/bbl` : `-$${Math.abs(diff)}/bbl`;
}

function priceDiffColor(diff: number): string {
  if (diff <= -3) return "text-emerald-400";
  if (diff <= 0)  return "text-green-400";
  if (diff <= 3)  return "text-yellow-400";
  return "text-orange-400";
}

function gradeLabel(compat: ScoredAlternative["gradeCompatibility"]): {
  label: string;
  color: string;
  dot: string;
} {
  if (compat === "compatible")
    return { label: "Compatible",       color: "text-emerald-400", dot: "bg-emerald-400" };
  if (compat === "partial")
    return { label: "Partial fit",      color: "text-yellow-400",  dot: "bg-yellow-400"  };
  return   { label: "Incompatible",     color: "text-red-400",     dot: "bg-red-400"     };
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="relative h-1.5 w-full rounded-full bg-white/5">
      <motion.div
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          value >= 70 ? "bg-emerald-500" :
          value >= 50 ? "bg-yellow-500" : "bg-orange-500"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function FactorBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-1 w-full rounded-full bg-white/5">
      <motion.div
        className={cn("absolute inset-y-0 left-0 rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  preset: DisruptionPreset;
};

export function ProcurementAlternatives({ preset }: Props) {
  const ranked = useMemo(() => rankAlternatives(preset.id), [preset.id]);
  const top = ranked[0];

  const isEnergyScenario = preset.category === "energy";

  if (!isEnergyScenario || ranked.length === 0) {
    return (
      <div className="solid-card rounded-xl border border-white/8 px-5 py-6 text-center text-sm text-muted-foreground">
        <Anchor className="mx-auto mb-2 size-5 opacity-40" />
        No crude procurement alternatives apply to this scenario type.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Anchor className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Procurement Alternatives
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/40">
          Illustrative · not live market data
        </span>
      </div>

      {/* Methodology note */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {SCORING_WEIGHTS.map((w) => (
            <div key={w.factor} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <span className="font-bold text-muted-foreground/90">{w.pct}</span>
              <span>{w.factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top recommendation banner */}
      {top && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3.5"
        >
          <div className="flex items-start gap-3">
            <Award className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 mb-0.5">
                Top Recommendation
              </div>
              <div className="text-sm font-bold text-foreground">{top.name}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className={priceDiffColor(top.priceDiffBbl)}>
                  {priceDiffLabel(top.priceDiffBbl)} vs Brent
                </span>
                <span>· {top.transitDays}d transit</span>
                <span>· {gradeLabel(top.gradeCompatibility).label}</span>
                <span className="font-semibold text-emerald-400">
                  Score: {top.compositeScore}/100
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
                {top.note}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ranked cards */}
      <AnimatePresence>
        {ranked.map((alt, idx) => {
          const gc = gradeLabel(alt.gradeCompatibility);
          const isTop = alt.rank === 1;
          return (
            <motion.div
              key={alt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                isTop
                  ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                  : "border-white/8 bg-[#0e1319]"
              )}
            >
              {/* Row header */}
              <div className="flex items-start gap-3">
                {/* Rank badge */}
                <div className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                  isTop
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/[0.06] text-muted-foreground"
                )}>
                  #{alt.rank}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-bold text-foreground">{alt.name}</span>
                    <span className="text-[10px] text-muted-foreground/50">{alt.grade}</span>
                  </div>

                  {/* Key stats row */}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="size-3 text-muted-foreground/50" aria-hidden />
                      <span className={cn("font-semibold", priceDiffColor(alt.priceDiffBbl))}>
                        {priceDiffLabel(alt.priceDiffBbl)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3 text-muted-foreground/50" aria-hidden />
                      <span>{alt.transitDays}d to west coast</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Beaker className="size-3 text-muted-foreground/50" aria-hidden />
                      <span className={gc.color}>{gc.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Anchor className="size-3 text-muted-foreground/50" aria-hidden />
                      <span>Availability {alt.availabilityScore}/5</span>
                    </div>
                  </div>
                </div>

                {/* Composite score */}
                <div className="shrink-0 text-right">
                  <div className={cn(
                    "text-xl font-black tabular-nums",
                    alt.compositeScore >= 70 ? "text-emerald-400" :
                    alt.compositeScore >= 50 ? "text-yellow-400" : "text-orange-400"
                  )}>
                    {alt.compositeScore}
                  </div>
                  <div className="text-[10px] text-muted-foreground/50">/100</div>
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-3">
                <ScoreBar value={alt.compositeScore} />
              </div>

              {/* Factor breakdown */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4">
                {[
                  { label: "Cost (40%)",     val: alt.factors.cost,         color: "bg-sky-500" },
                  { label: "Transit (30%)",  val: alt.factors.transit,      color: "bg-violet-500" },
                  { label: "Avail. (20%)",   val: alt.factors.availability, color: "bg-amber-500" },
                  { label: "Grade (10%)",    val: alt.factors.gradeCompat,  color: "bg-emerald-500" },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="mb-1 flex justify-between text-[10px] text-muted-foreground/50">
                      <span>{f.label}</span>
                      <span>{Math.round(f.val * 100)}%</span>
                    </div>
                    <FactorBar value={f.val} color={f.color} />
                  </div>
                ))}
              </div>

              {/* Note */}
              <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground/60">
                {alt.note}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Data disclaimer */}
      <div className="flex items-start gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[10px] text-muted-foreground/40">
        <Info className="mt-0.5 size-3 shrink-0" aria-hidden />
        <span>
          All figures are illustrative heuristic estimates for decision-support purposes.
          Price differentials from 2024 Platts/Argus averages. Transit times to Mundra/Jamnagar.
          Availability scores are qualitative. Not live market data — verify before trading decisions.
        </span>
      </div>
    </div>
  );
}
