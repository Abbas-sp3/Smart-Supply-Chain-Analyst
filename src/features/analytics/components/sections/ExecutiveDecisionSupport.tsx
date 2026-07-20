"use client";

import { Lightbulb, Package, Shield, Clock, TrendingDown } from "lucide-react";
import type { ScenarioAnalysis } from "@/features/analytics/services/analyticsEngine";
import { CRUDE_ALTERNATIVES } from "@/features/procurement/data/alternativeSources";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";

type Props = {
  activeAnalysis: ScenarioAnalysis;
  activePreset: DisruptionPreset;
};

export function ExecutiveDecisionSupport({ activeAnalysis, activePreset }: Props) {
  const bestAlt = CRUDE_ALTERNATIVES.filter(
    (a) =>
      !a.relevantForPresets ||
      a.relevantForPresets.length === 0 ||
      a.relevantForPresets.includes(activePreset.id)
  ).sort((a, b) => a.priceDiffBbl - b.priceDiffBbl)[0];

  const secondAlt = CRUDE_ALTERNATIVES.filter(
    (a) =>
      !a.relevantForPresets ||
      a.relevantForPresets.length === 0 ||
      a.relevantForPresets.includes(activePreset.id)
  ).sort((a, b) => a.priceDiffBbl - b.priceDiffBbl)[1];

  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      <div className="mb-2 flex items-center gap-2">
        <Lightbulb className="size-4 text-yellow-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">
          Executive Decision Support
        </span>
      </div>
      <h3 className="mb-5 text-base font-semibold text-foreground">
        If <span className="text-amber-400">{activePreset.label}</span> occurred today — what should India do?
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recommendations */}
        <div className="space-y-3">
          <DecisionCard
            icon={<Package className="size-4 text-sky-400" />}
            title="Primary Recommendation"
            label="Procurement"
            value={bestAlt ? `Activate ${bestAlt.name}` : "Diversify procurement away from Gulf sources"}
            detail={
              bestAlt
                ? `${bestAlt.priceDiffBbl >= 0 ? "+" : ""}${bestAlt.priceDiffBbl.toFixed(1)} $/bbl vs Brent · ${bestAlt.transitDays} days transit · ${bestAlt.availabilityScore}/5 tanker availability`
                : undefined
            }
          />
          {secondAlt && (
            <DecisionCard
              icon={<Package className="size-4 text-violet-400" />}
              title="Secondary Recommendation"
              label="Procurement Alt"
              value={`${secondAlt.name}`}
              detail={`${secondAlt.priceDiffBbl >= 0 ? "+" : ""}${secondAlt.priceDiffBbl.toFixed(1)} $/bbl · ${secondAlt.gradeCompatibility} grade compatibility`}
            />
          )}
          <DecisionCard
            icon={<Shield className="size-4 text-amber-400" />}
            title="SPR Action"
            label="Strategic Reserve"
            value={
              activeAnalysis.sprRequired
                ? "Release Advised — activate drawdown at maximum physical rate"
                : "Hold — commercial buffer sufficient, no SPR release required"
            }
            highlight={activeAnalysis.sprRequired ? "warn" : "ok"}
          />
        </div>

        {/* Expected outcomes */}
        <div className="grid grid-cols-2 gap-3 content-start">
          <OutcomeCard
            label="Expected Supply Gap"
            value={`${activeAnalysis.supplyGapMtpa.toFixed(1)} Mtpa`}
            color="text-red-400"
          />
          <OutcomeCard
            label="Expected Recovery"
            value={
              activeAnalysis.estimatedRecoveryDays > 0
                ? `${activeAnalysis.estimatedRecoveryDays} days`
                : "Not required"
            }
            color="text-amber-400"
          />
          <OutcomeCard
            label="SPR Usage"
            value={activeAnalysis.sprRequired ? "RELEASE" : "HOLD"}
            color={activeAnalysis.sprRequired ? "text-red-400" : "text-emerald-400"}
          />
          <OutcomeCard
            label="Affected Refineries"
            value={`${activeAnalysis.affectedRefineryCount} clusters`}
            color="text-foreground"
          />
          <OutcomeCard
            label="Locked Volume"
            value={`${activeAnalysis.totalLockedVolumeMtpa.toFixed(1)} Mtpa`}
            color="text-orange-400"
          />
          <OutcomeCard
            label="Scenario Duration"
            value={`${activeAnalysis.durationDays} days`}
            color="text-foreground"
          />
        </div>
      </div>
    </div>
  );
}

function DecisionCard({
  icon, title, label, value, detail, highlight,
}: {
  icon: React.ReactNode;
  title: string;
  label: string;
  value: string;
  detail?: string;
  highlight?: "warn" | "ok";
}) {
  const borderClass =
    highlight === "warn"
      ? "border-amber-500/30 bg-amber-500/[0.04]"
      : highlight === "ok"
      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
      : "border-white/5 bg-[#181e28]";

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <p className="text-xs font-semibold text-foreground/90">{value}</p>
      {detail && <p className="mt-1 text-[10px] text-muted-foreground/60">{detail}</p>}
    </div>
  );
}

function OutcomeCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#181e28] p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
