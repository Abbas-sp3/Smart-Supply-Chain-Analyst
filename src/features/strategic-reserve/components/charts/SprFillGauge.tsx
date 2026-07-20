"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

import {
  ISPRL_PHASE_1_FACILITIES,
  ISPRL_TOTAL_CAPACITY_MMT,
  ISPRL_CURRENT_STATE
} from "@/features/scenario-simulator/constants/reserve-config";

function FacilityGauge({ name, capacityMmt, fillPct, state }: {
  name: string; capacityMmt: number; fillPct: number; state: string;
}) {
  const filledMmt = (capacityMmt * fillPct / 100).toFixed(2);
  const data = [{ value: fillPct, fill: "#34d399" }];
  return (
    <div className="solid-card rounded-xl border border-white/10 p-4 flex flex-col items-center">
      <div className="relative w-32 h-[80px] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="65%" outerRadius="95%"
              startAngle={180} endAngle={0}
              data={data} barSize={10}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={5} background={{ fill: "rgba(255,255,255,0.04)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-xl font-black tabular-nums text-emerald-400 leading-none">{fillPct}%</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-foreground">{name}</div>
        <div className="text-[10px] text-muted-foreground">{state}</div>
        <div className="mt-1 text-xs text-muted-foreground/60 tabular-nums">
          {filledMmt} / {capacityMmt.toFixed(2)} MMT
        </div>
      </div>
    </div>
  );
}

export function SprFillGauge() {
  const { nationalFillPercent, currentFillMmt, currentCoverDays, ieaNormDays } = ISPRL_CURRENT_STATE;
  
  const nationalData = [{ value: nationalFillPercent, fill: "#34d399" }];
  const coverData = [{ value: Math.min(100, (currentCoverDays / ieaNormDays) * 100), fill: currentCoverDays >= 90 ? "#34d399" : currentCoverDays >= 60 ? "#facc15" : "#f87171" }];

  return (
    <div className="space-y-4">
      {/* National aggregate + IEA cover gauge */}
      <div className="grid grid-cols-2 gap-4">
        <div className="solid-card rounded-xl border border-white/10 p-5 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">National Fill</div>
          <div className="relative w-36 h-[72px] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[144px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={nationalData} barSize={12}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(255,255,255,0.04)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-400 leading-none">{nationalFillPercent}%</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground text-center tabular-nums">{currentFillMmt} / {ISPRL_TOTAL_CAPACITY_MMT} MMT</div>
        </div>

        <div className="solid-card rounded-xl border border-white/10 p-5 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Days of Cover vs IEA Norm</div>
          <div className="relative w-36 h-[72px] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[144px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={coverData} barSize={12}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(255,255,255,0.04)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="text-2xl font-black text-yellow-400 leading-none">{currentCoverDays}d</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground text-center">IEA norm: {ieaNormDays} days | India: {currentCoverDays}d</div>
        </div>
      </div>

      {/* Per-facility gauges */}
      <div className="grid grid-cols-3 gap-4">
        {ISPRL_PHASE_1_FACILITIES.map((f) => (
          <FacilityGauge key={f.id} name={f.name} state={f.state} capacityMmt={f.capacityMmt} fillPct={f.fillPct} />
        ))}
      </div>
      
      <div className="text-[10px] text-muted-foreground/50 text-right">
        * Capacities reflect exact Indian Strategic Petroleum Reserves Limited (ISPRL) Phase I physical infrastructure.
      </div>
    </div>
  );
}
