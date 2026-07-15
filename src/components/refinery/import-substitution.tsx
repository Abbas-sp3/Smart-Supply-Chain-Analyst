"use client";

import { useState, useEffect } from "react";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";

type Refinery = {
  name: string;
  owner: string;
  capacityMMTPA: number;
  utilizationPct: number;
  nelsonComplexityIndex: number | null;
  region: string;
  bufferDays: number;
};

type SubstitutionResult = {
  name: string;
  owner: string;
  spareCapacityMMTPA: number;
  canAbsorb: boolean;
  complexity: number | null;
  region: string;
  reason: string;
};

type Props = {
  refineries: Refinery[];
};

function compute(refineries: Refinery[], lostMMTPA: number): SubstitutionResult[] {
  if (lostMMTPA <= 0) return [];

  const sorted = [...refineries].sort((a, b) => {
    const spareA = a.capacityMMTPA * (1 - a.utilizationPct / 100);
    const spareB = b.capacityMMTPA * (1 - b.utilizationPct / 100);
    return spareB - spareA;
  });

  let remaining = lostMMTPA;
  const subs: SubstitutionResult[] = [];

  for (const r of sorted) {
    const spare = r.capacityMMTPA * (1 - r.utilizationPct / 100);
    const buffer = r.bufferDays * (r.capacityMMTPA / 365);
    const available = spare + buffer * 0.3;
    const canTake = Math.min(available, remaining);

    if (canTake > 0.05) {
      const nci = r.nelsonComplexityIndex ?? 8;
      const canAbsorb = nci >= 10 && canTake > 0.5;
      subs.push({
        name: r.name,
        owner: r.owner,
        spareCapacityMMTPA: Math.round(canTake * 10) / 10,
        canAbsorb,
        complexity: r.nelsonComplexityIndex,
        region: r.region,
        reason: canAbsorb
          ? `NCI ${nci} \u2014 can reroute & process alternate crude`
          : nci < 10
          ? `Low complexity (${nci}) \u2014 limited crude switching`
          : `Spare too small (${canTake.toFixed(1)} MMTPA)`,
      });
      remaining -= canTake;
      if (remaining <= 0.05) break;
    }
  }

  return subs;
}

export function ImportSubstitutionCalculator({ refineries }: Props) {
  const [lostMMTPA, setLostMMTPA] = useState(20);
  const [results, setResults] = useState<SubstitutionResult[]>([]);

  useEffect(() => {
    setResults(compute(refineries, lostMMTPA));
  }, [refineries, lostMMTPA]);

  const totalAbsorbable = results.filter((r) => r.canAbsorb).reduce((s, r) => s + r.spareCapacityMMTPA, 0);
  const gapPct = lostMMTPA > 0 ? Math.max(0, ((lostMMTPA - totalAbsorbable) / lostMMTPA) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-muted-foreground" />
          <label className="text-[10px] uppercase text-muted-foreground/50">Supply shock (MMTPA lost)</label>
        </div>
        <input
          type="number"
          value={lostMMTPA}
          onChange={(e) => setLostMMTPA(Number(e.target.value) || 0)}
          className="w-24 rounded-lg border border-white/10 bg-[#0f1c28] px-3 py-1.5 text-xs text-foreground/80 outline-none focus:border-primary/30 numeric"
          min={0}
          max={300}
          step={5}
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <p className="text-[9px] uppercase text-muted-foreground/40">Can Absorb</p>
              <p className="text-sm font-bold text-emerald-400 numeric">{totalAbsorbable.toFixed(1)} MMTPA</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <p className="text-[9px] uppercase text-muted-foreground/40">Uncovered Gap</p>
              <p className={`text-sm font-bold numeric ${gapPct > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {gapPct > 0 ? `${gapPct.toFixed(0)}%` : "Covered"}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <p className="text-[9px] uppercase text-muted-foreground/40">Refineries Involved</p>
              <p className="text-sm font-bold text-foreground/80 numeric">{results.filter((r) => r.canAbsorb).length}</p>
            </div>
          </div>

          <div className="space-y-1">
            {results.map((r) => (
              <div key={r.name} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                r.canAbsorb ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]"
              }`}>
                {r.canAbsorb ? (
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="size-3.5 text-amber-400/60 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/80 truncate">{r.name}</p>
                  <p className="text-[9px] text-muted-foreground/50">{r.reason}</p>
                </div>
                <span className={`text-[11px] font-medium numeric ${r.canAbsorb ? "text-emerald-400" : "text-muted-foreground/40"}`}>
                  +{r.spareCapacityMMTPA} MMTPA
                </span>
              </div>
            ))}
          </div>

          {gapPct > 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
              <AlertTriangle className="size-3.5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-400/80 leading-relaxed">
                <span className="font-semibold">Shortfall of {(lostMMTPA - totalAbsorbable).toFixed(1)} MMTPA</span> cannot be absorbed by existing spare capacity.
                Strategic reserves, demand curtailment, or new sourcing would be needed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
