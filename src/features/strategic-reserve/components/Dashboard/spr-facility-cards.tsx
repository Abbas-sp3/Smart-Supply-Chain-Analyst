"use client";

import { Database, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const FACILITIES = [
  {
    id: "padur",
    name: "Padur",
    state: "Karnataka",
    capacityMmt: 2.5,
  },
  {
    id: "mangaluru",
    name: "Mangaluru",
    state: "Karnataka",
    capacityMmt: 1.5,
  },
  {
    id: "vizag",
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    capacityMmt: 1.33,
  },
];

const NATIONAL_FILL_PERCENT = 77;
const TOTAL_CAPACITY = 5.33;
const CURRENT_FILL_MMT = 4.094;

export function SprFacilityCards() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Database className="size-4 text-emerald-400" />
            ISPRL Phase I Facilities
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Operational strategic petroleum reserves · Source: ISPRL & Govt reports (Feb 2026)
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {CURRENT_FILL_MMT} <span className="text-sm font-normal text-muted-foreground">/ {TOTAL_CAPACITY} MMT</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mt-1">
            {NATIONAL_FILL_PERCENT}% Filled (National Aggregate)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FACILITIES.map((facility) => {
          const filled = (facility.capacityMmt * (NATIONAL_FILL_PERCENT / 100)).toFixed(2);
          return (
            <div
              key={facility.id}
              className="solid-card relative overflow-hidden rounded-xl border border-white/10 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{facility.name}</h3>
                  <div className="text-xs text-muted-foreground">{facility.state}</div>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Database className="size-4 text-muted-foreground/70" />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-lg font-bold tabular-nums">
                    {filled} <span className="text-xs font-normal text-muted-foreground">MMT</span>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {facility.capacityMmt.toFixed(2)} MMT
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/40 border border-white/5">
                  <div
                    className="h-full bg-emerald-500/80 transition-all duration-1000"
                    style={{ width: `${NATIONAL_FILL_PERCENT}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Info className="size-3" />
                    Est. at 77% aggregate
                  </span>
                  <span>{NATIONAL_FILL_PERCENT}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
