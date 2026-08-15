"use client";

import { Shield, Building2, Clock } from "lucide-react";
import type { ReserveMechanism } from "@/data/countries/types";

interface Props {
  country: { name: string };
  mechanism: Extract<ReserveMechanism, { type: "mandated_stockholding" }>;
}

export function MandatedStockholdingPanel({ country, mechanism }: Props) {
  const { totalCoverDays, details } = mechanism;
  const coverColor =
    totalCoverDays >= 90 ? "text-emerald-400" :
    totalCoverDays >= 60 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-4">
      {/* Summary gauges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="solid-card rounded-xl border border-white/10 p-5 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            Mandatory Stockholding Cover
          </div>
          <span className={`text-4xl font-black tabular-nums ${coverColor}`}>
            {totalCoverDays}d
          </span>
          <div className="mt-2 text-[10px] text-muted-foreground text-center">
            IEA norm: 90 days
          </div>
        </div>

        <div className="solid-card rounded-xl border border-white/10 p-5 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            Min Statutory Requirement
          </div>
          <span className="text-4xl font-black tabular-nums text-blue-400">
            {details.minimumStockholdingDays}d
          </span>
          <div className="mt-2 text-[10px] text-muted-foreground text-center">
            Mandated minimum
          </div>
        </div>
      </div>

      {/* Mechanism description */}
      <div className="solid-card rounded-xl border border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stockholding Mechanism
          </span>
        </div>

        <div className="flex items-start gap-3 text-xs text-muted-foreground/80 leading-relaxed">
          <Clock className="size-3.5 mt-0.5 shrink-0 text-blue-400" />
          <span>
            <span className="text-foreground font-medium">{country.name}</span> operates a{" "}
            <strong>mandatory private stockholding</strong> regime: licensed importers are legally
            required to hold a minimum of {details.minimumStockholdingDays} days of supply at all times.
          </span>
        </div>

        <div className="flex items-start gap-3 text-xs text-muted-foreground/80 leading-relaxed">
          <Building2 className="size-3.5 mt-0.5 shrink-0 text-emerald-400" />
          <div>
            <div className="text-foreground font-medium mb-1">Licensed Importers / Terminal Operators</div>
            <div className="flex flex-wrap gap-1.5">
              {details.licensedImporters.map((imp) => (
                <span key={imp} className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono">
                  {imp.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground/50 pt-1 border-t border-white/5">
          Enforcement: {details.enforcementMechanism}
        </div>
      </div>
    </div>
  );
}
