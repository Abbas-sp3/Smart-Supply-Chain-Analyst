"use client";

import { useState } from "react";
import { Link2, ExternalLink } from "lucide-react";

type Refinery = {
  name: string;
  owner: string;
  capacityMMTPA: number;
  nelsonComplexityIndex: number | null;
  region: string;
  crudeGrades: string[];
};

type Props = {
  refineries: Refinery[];
  highlightGrade?: string;
  onNavigateToRefinery?: (name: string) => void;
};

const GRADE_ORIGIN: Record<string, string> = {
  "Arab Light": "Saudi Arabia",
  "Arab Heavy": "Saudi Arabia",
  "Basrah Light": "Iraq",
  "Iranian Heavy": "Iran",
  "Upper Zakum": "UAE",
  "Bonny Light": "Nigeria",
  "ESPO": "Russia",
  "Urals": "Russia",
  "Mars": "USA",
  "WTI Midland": "USA",
  "Das": "UAE",
  "Murban": "UAE",
};

export function CrudeCompatibilityPanel({ refineries, highlightGrade, onNavigateToRefinery }: Props) {
  const [selectedGrade, setSelectedGrade] = useState(highlightGrade ?? "");
  const grade = selectedGrade || highlightGrade || "";

  const compatible = grade
    ? refineries
        .filter((r) => r.crudeGrades.includes(grade))
        .sort((a, b) => b.capacityMMTPA - a.capacityMMTPA)
    : [];

  const origin = GRADE_ORIGIN[grade] ?? "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-muted-foreground" />
        <p className="text-xs font-semibold text-foreground/80">Crude to Refinery Compatibility</p>
      </div>

      {!grade && (
        <p className="text-[11px] text-muted-foreground/50">
          When Procurement suggests a crude grade, the matching refineries appear here.
          Select a grade from the dropdown above or from Procurement sourcing options.
        </p>
      )}

      {grade && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs text-primary font-medium">
              {grade}
            </span>
            {origin && (
              <span className="text-[10px] text-muted-foreground/50">Origin: {origin}</span>
            )}
            <span className="text-[10px] text-muted-foreground/40">
              &middot; {compatible.length} {compatible.length === 1 ? "refinery" : "refineries"} can process
            </span>
          </div>

          {compatible.length > 0 ? (
            <div className="space-y-1">
              {compatible.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => onNavigateToRefinery?.(r.name)}
                  className="w-full flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-left hover:bg-emerald-500/10 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 truncate">{r.name}</p>
                    <p className="text-[9px] text-muted-foreground/50">{r.owner}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-foreground/60 numeric">{r.capacityMMTPA} MMTPA</span>
                    <span className="text-[10px] text-muted-foreground/40 numeric">NCI {r.nelsonComplexityIndex ?? "\u2014"}</span>
                  </div>
                  <ExternalLink className="size-3 text-muted-foreground/30 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-[11px] text-amber-400/80">
                No refineries in the current dataset are configured to process {grade}.
                This may indicate a sourcing compatibility gap.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
