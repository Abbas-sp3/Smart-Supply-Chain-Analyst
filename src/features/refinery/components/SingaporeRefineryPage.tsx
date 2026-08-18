"use client";

/**
 * Singapore Refinery & Processing Dashboard
 * Feature-complete equivalent of the India refinery page.
 * Rendered when activeCountry.id === "singapore"
 */

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";
import {
  Factory, Activity, ShieldAlert, ArrowUpRight, Globe2,
  Gauge, Link2, Building2, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Zap, Droplets, Wind,
  Ship, TrendingUp, Calculator, BarChart2,
} from "lucide-react";
import {
  SINGAPORE_REFINERIES,
  SG_CRUDE_GRADES,
  SG_DISRUPTION_SCENARIOS,
  SG_FEEDSTOCK_FLOWS,
  SG_TOTAL_CAPACITY_MMTPA,
  SG_TOTAL_CDU_BPD,
  SG_AVG_NCI,
  SG_AVG_UTIL,
  SG_REFINERY_THROUGHPUT_PROFILE,
  DATA_SOURCE_NOTE_SG,
  type SgRefineryRecord,
  type SgCrudeGrade,
  type SgDisruptionScenario,
} from "@/features/refinery/constants/singapore";
import type { CountryProfile } from "@/data/countries/types";

// ── Color Palettes ────────────────────────────────────────────────────────────
const ISLAND_COLORS: Record<string, string> = {
  "Jurong Island": "#3b82f6",
  "Pulau Bukom": "#f59e0b",
  "Jurong Industrial Estate": "#10b981",
};

const PRODUCT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6",
];

const STATUS_CONFIG = {
  operational: { bg: "border-emerald-500/20 bg-emerald-500/5", text: "text-emerald-400", label: "Operational" },
  expanding:   { bg: "border-blue-500/20 bg-blue-500/5",    text: "text-blue-400",    label: "Expanding" },
  converting:  { bg: "border-violet-500/20 bg-violet-500/5", text: "text-violet-400",  label: "Converting" },
  legacy:      { bg: "border-amber-500/20 bg-amber-500/5",  text: "text-amber-400",   label: "Legacy" },
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#090d16]/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <div className="font-bold text-foreground mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex gap-2">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="text-foreground font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="glass-surface rounded-xl border border-white/10 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

// ── Refinery Card ─────────────────────────────────────────────────────────────
function RefineryCard({ refinery, rank }: { refinery: SgRefineryRecord; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[refinery.status];
  const islandColor = ISLAND_COLORS[refinery.island] ?? "#60a5fa";
  const utilColor = refinery.utilizationPct >= 90
    ? "text-rose-400" : refinery.utilizationPct >= 80
    ? "text-amber-400" : "text-emerald-400";
  const utilBarColor = refinery.utilizationPct >= 90
    ? "bg-rose-400" : refinery.utilizationPct >= 80
    ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className={`glass-surface rounded-xl border p-5 space-y-4 ${st.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-black/40 border border-white/10 text-xs font-black" style={{ color: islandColor }}>
            {rank}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{refinery.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {refinery.operator} · <span style={{ color: islandColor }}>{refinery.island}</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{refinery.ownership}</p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-2xl font-black tabular-nums text-primary">{refinery.capacityMMTPA}</p>
          <p className="text-[9px] uppercase text-muted-foreground tracking-wider">MMTPA</p>
          <p className="text-[10px] font-semibold text-muted-foreground/70 mt-1">
            {(refinery.crudeDistillationCapBPD / 1000).toFixed(0)}k bpd
          </p>
        </div>
      </div>

      {/* Status + NCI */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${st.bg} ${st.text}`}>
          {st.label}
        </span>
        <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
          NCI {refinery.nelsonComplexityIndex.toFixed(1)}
        </span>
        <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          {refinery.feedstockBuffer}d feedstock buffer
        </span>
        <span className="text-[10px] text-muted-foreground">Est. {refinery.commissioned}</span>
      </div>

      {/* Utilization bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Throughput Utilization</span>
          <span className={`font-bold ${utilColor}`}>{refinery.utilizationPct}%</span>
        </div>
        <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${utilBarColor}`}
            style={{ width: `${Math.min(100, refinery.utilizationPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1 text-muted-foreground/50">
          <span>{((refinery.capacityMMTPA * refinery.utilizationPct) / 100).toFixed(1)} MMTPA actual output</span>
          <span>{((refinery.capacityMMTPA) * 0.05).toFixed(1)} MMTPA spare headroom</span>
        </div>
      </div>

      {/* Primary crude grades summary */}
      <div className="flex flex-wrap gap-1.5">
        {refinery.primaryCrudeGrades.slice(0, 3).map((g) => (
          <span key={g} className="text-[9px] font-medium border border-white/10 bg-white/[0.03] text-muted-foreground/80 px-2 py-0.5 rounded">
            {g}
          </span>
        ))}
        {refinery.primaryCrudeGrades.length > 3 && (
          <span className="text-[9px] font-medium border border-white/10 bg-white/[0.03] text-muted-foreground/50 px-2 py-0.5 rounded">
            +{refinery.primaryCrudeGrades.length - 3} more
          </span>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {expanded ? "Hide" : "Show"} breakdown
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="pt-3 border-t border-white/[0.06] space-y-4">
          {/* Output product breakdown */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
              Output Product Breakdown
            </p>
            <div className="space-y-2">
              {refinery.outputProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="text-[10px] text-muted-foreground/70 w-36 shrink-0">{p.name}</div>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.pctOfOutput}%`,
                        backgroundColor: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-foreground tabular-nums w-8 text-right">
                    {p.pctOfOutput}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade units */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Processing Units / Upgraders
            </p>
            <div className="flex flex-wrap gap-1.5">
              {refinery.upgradeUnits.map((u) => (
                <span key={u} className="text-[9px] font-medium text-sky-300/80 border border-sky-500/20 bg-sky-500/5 px-2 py-0.5 rounded">
                  {u}
                </span>
              ))}
            </div>
          </div>

          {/* All crude grades */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Processable Crude Grades
            </p>
            <div className="flex flex-wrap gap-1.5">
              {refinery.primaryCrudeGrades.map((g) => (
                <span key={g} className="text-[9px] font-medium text-amber-300/80 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          {refinery.notes && (
            <p className="text-[10px] italic text-muted-foreground/60 leading-relaxed border-t border-white/[0.05] pt-3">
              {refinery.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Crude Grade Compatibility Panel ───────────────────────────────────────────
function CrudeCompatibilityMatrix({ selectedGrade, setSelectedGrade }: {
  selectedGrade: SgCrudeGrade | null;
  setSelectedGrade: (g: SgCrudeGrade | null) => void;
}) {
  const mideast = SG_CRUDE_GRADES.filter(g => g.mideastShare);
  const other = SG_CRUDE_GRADES.filter(g => !g.mideastShare);
  const totalImport = SG_CRUDE_GRADES.reduce((s, g) => s + g.importSharePct, 0);

  const gradeToRefineries = (grade: SgCrudeGrade) =>
    SINGAPORE_REFINERIES.filter(r => grade.compatibleRefineries.includes(r.id));

  const typeColor: Record<string, string> = {
    sweet: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    medium: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    sour: "text-rose-400 border-rose-500/30 bg-rose-500/5",
  };

  const pieData = SG_CRUDE_GRADES.map(g => ({
    name: g.name,
    value: g.importSharePct,
    fill: g.mideastShare ? "#f59e0b" : "#3b82f6",
  }));

  return (
    <div className="glass-surface rounded-xl border border-white/10 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Droplets className="size-4 text-sky-400" />
            Crude Feed Compatibility Matrix
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Select a crude grade to see compatible refineries and transit routes
          </p>
        </div>
        <div className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          ~56% Middle East Origin
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_200px] gap-5">
        {/* Grade list */}
        <div className="space-y-3">
          {/* Middle East Grades */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 mb-1.5">
            🌍 Middle East (Gulf Crude) — {mideast.reduce((s, g) => s + g.importSharePct, 0)}% of imports
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mideast.map(grade => (
              <button
                key={grade.name}
                onClick={() => setSelectedGrade(selectedGrade?.name === grade.name ? null : grade)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedGrade?.name === grade.name
                    ? "border-sky-500/50 bg-sky-500/10"
                    : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-foreground">{grade.name}</p>
                  <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${typeColor[grade.type]}`}>
                    {grade.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{grade.origin}</p>
                <div className="flex justify-between mt-1.5 text-[10px]">
                  <span className="text-muted-foreground/60">API {grade.apiGravity} · S {grade.sulfurPct}%</span>
                  <span className="font-bold text-amber-400">{grade.importSharePct}%</span>
                </div>
                <div className="mt-1.5 text-[9px] text-sky-400">
                  Transit via Malacca: {grade.transitDaysMalacca}d
                </div>
              </button>
            ))}
          </div>

          {/* Other grades */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400/80 mb-1.5 pt-2">
            🌐 Regional / Spot Grades — {other.reduce((s, g) => s + g.importSharePct, 0)}% of imports
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {other.map(grade => (
              <button
                key={grade.name}
                onClick={() => setSelectedGrade(selectedGrade?.name === grade.name ? null : grade)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedGrade?.name === grade.name
                    ? "border-sky-500/50 bg-sky-500/10"
                    : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-foreground">{grade.name}</p>
                  <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${typeColor[grade.type]}`}>
                    {grade.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{grade.origin}</p>
                <div className="flex justify-between mt-1.5 text-[10px]">
                  <span className="text-muted-foreground/60">API {grade.apiGravity} · S {grade.sulfurPct}%</span>
                  <span className="font-bold text-blue-400">{grade.importSharePct}%</span>
                </div>
                <div className="mt-1.5 text-[9px] text-sky-400">
                  Transit: {grade.transitDaysMalacca}d
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Import Share</p>
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="transparent"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.75 + (i * 0.02)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 text-center">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-amber-400" />
              <span className="text-[9px] text-muted-foreground">Middle East {mideast.reduce((s, g) => s + g.importSharePct, 0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-blue-400" />
              <span className="text-[9px] text-muted-foreground">Other Origins {other.reduce((s, g) => s + g.importSharePct, 0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected grade detail */}
      {selectedGrade && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-sky-300">
              {selectedGrade.name} <span className="text-muted-foreground font-normal text-xs">— {selectedGrade.origin}</span>
            </p>
            <button onClick={() => setSelectedGrade(null)} className="text-muted-foreground/50 hover:text-foreground text-xs">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-black text-foreground">{selectedGrade.apiGravity}°</p>
              <p className="text-[9px] text-muted-foreground">API Gravity</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-foreground">{selectedGrade.sulfurPct}%</p>
              <p className="text-[9px] text-muted-foreground">Sulfur Content</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-foreground">{selectedGrade.importSharePct}%</p>
              <p className="text-[9px] text-muted-foreground">Import Share</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Compatible Refineries:</p>
            <div className="space-y-1.5">
              {gradeToRefineries(selectedGrade).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{r.name}</p>
                    <p className="text-[9px] text-muted-foreground">{r.operator}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400">NCI {r.nelsonComplexityIndex}</p>
                    <p className="text-[9px] text-muted-foreground">{r.capacityMMTPA} MMTPA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground/60 italic">
            Malacca transit time: {selectedGrade.transitDaysMalacca} days ·{" "}
            Grade type: <span className="font-semibold uppercase">{selectedGrade.type}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Disruption Scenario Panel ─────────────────────────────────────────────────
function DisruptionImpactPanel() {
  const [selected, setSelected] = useState<SgDisruptionScenario | null>(null);

  return (
    <div className="glass-surface rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-rose-400" />
        <p className="text-sm font-bold uppercase tracking-wider text-foreground">
          Disruption Scenario — Refinery Impact Analysis
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Click a scenario to see which refineries are affected, at-risk capacity, and downstream product impacts.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SG_DISRUPTION_SCENARIOS.map((sc) => {
          const isHigh = sc.severityPct >= 60;
          const isSel = selected?.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setSelected(isSel ? null : sc)}
              className={`text-left rounded-xl border p-4 space-y-2 transition-all ${
                isSel
                  ? "border-sky-500/50 bg-sky-500/10"
                  : isHigh
                  ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                  : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
              }`}
            >
              <p className="text-xs font-semibold text-foreground leading-tight">{sc.name}</p>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2">{sc.description}</p>
              <div className="flex items-center gap-3 pt-1">
                <span className={`text-[10px] font-bold ${isHigh ? "text-rose-400" : "text-amber-400"}`}>
                  ~{sc.atRiskCapacityMMTPA.toFixed(1)} MMTPA at risk
                </span>
                <span className="text-[10px] text-muted-foreground/50">{sc.durationDays}d</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-white/60 border border-white/10 rounded px-1.5 py-0.5">
                  Sev. {sc.severityPct}%
                </span>
                <span className="text-[9px] text-muted-foreground/50">
                  {sc.affectedRefineries.length} facilit{sc.affectedRefineries.length > 1 ? "ies" : "y"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded scenario detail */}
      {selected && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-4">
          <div className="flex justify-between items-start">
            <p className="text-sm font-bold text-sky-300">{selected.name}</p>
            <button onClick={() => setSelected(null)} className="text-muted-foreground/50 hover:text-foreground text-xs">✕</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "At-Risk Capacity", value: `${selected.atRiskCapacityMMTPA.toFixed(1)} MMTPA`, color: "text-rose-400" },
              { label: "Duration", value: `${selected.durationDays} days`, color: "text-amber-400" },
              { label: "Severity", value: `${selected.severityPct}%`, color: "text-orange-400" },
              { label: "Est. Price Impact", value: `+${selected.priceImpactPct.low}–${selected.priceImpactPct.high}%`, color: "text-violet-400" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.03] rounded-lg border border-white/5 p-3 text-center">
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Affected Refinery Facilities</p>
            <div className="space-y-2">
              {selected.affectedRefineries.map((rid) => {
                const ref = SINGAPORE_REFINERIES.find(r => r.id === rid);
                if (!ref) return null;
                const lost = ref.capacityMMTPA * (selected.severityPct / 100);
                return (
                  <div key={rid} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{ref.name}</p>
                      <p className="text-[9px] text-muted-foreground">{ref.island} · NCI {ref.nelsonComplexityIndex}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-400">-{lost.toFixed(1)} MMTPA</p>
                      <p className="text-[9px] text-muted-foreground">at risk</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Downstream Product Impacts</p>
            <div className="space-y-1.5">
              {selected.productImpacts.map((p) => (
                <div key={p.product} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/80 w-48 shrink-0">{p.product}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500/70 rounded-full" style={{ width: `${p.impactPct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 tabular-nums w-8 text-right">{p.impactPct}%</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-muted-foreground/50 italic">{selected.atRiskReasoningNote}</p>
        </div>
      )}
    </div>
  );
}

// ── Feedstock Supply Chain Panel ──────────────────────────────────────────────
function FeedstockFlowPanel() {
  return (
    <div className="glass-surface rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Ship className="size-4 text-blue-400" />
        <p className="text-sm font-bold uppercase tracking-wider text-foreground">
          Feedstock Supply Chain Routes
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/60">
        Crude origin countries, maritime routes, chokepoints, and share of Singapore's total import basket.
      </p>

      {/* Bar chart of import share */}
      <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
        <p className="text-[10px] text-muted-foreground/70 font-semibold mb-3">Import Share by Origin</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={SG_FEEDSTOCK_FLOWS.map(f => ({ name: f.supplier, share: f.shareOfImportsPct, days: f.transitDays }))}
            margin={{ top: 0, right: 10, left: 0, bottom: 20 }}
            layout="horizontal"
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              angle={-30}
              textAnchor="end"
            />
            <YAxis
              unit="%"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="share" name="Import Share %" radius={[4, 4, 0, 0]}>
              {SG_FEEDSTOCK_FLOWS.map((_, i) => (
                <Cell key={i} fill={i < 4 ? "#f59e0b" : "#3b82f6"} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Route breakdown */}
      <div className="space-y-2.5">
        {SG_FEEDSTOCK_FLOWS.map((f, i) => (
          <div key={i} className="flex items-start justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">{f.supplier}</p>
                <span className="text-[9px] text-muted-foreground/60">— {f.origin}</span>
              </div>
              <p className="text-[10px] text-amber-300/70 font-medium mt-0.5">{f.grade}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5 leading-relaxed line-clamp-2">{f.route}</p>
              {f.chokepoints.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {f.chokepoints.map((cp) => (
                    <span key={cp} className="text-[8px] font-semibold text-rose-300/70 border border-rose-500/20 bg-rose-500/5 px-1.5 py-0.5 rounded">
                      ⚠ {cp}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-amber-400">{f.shareOfImportsPct}%</p>
              <p className="text-[9px] text-muted-foreground/60">of imports</p>
              <p className="text-[10px] font-semibold text-sky-400 mt-1">{f.transitDays}d transit</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Import Substitution Calculator ────────────────────────────────────────────
function ImportSubstitutionCalculator({ country }: { country: CountryProfile }) {
  const [shockMMTPA, setShockMMTPA] = useState(20);

  const totalCapacity = SG_TOTAL_CAPACITY_MMTPA;
  const totalSpare = SINGAPORE_REFINERIES.reduce((s, r) => {
    const spareCapacity = r.capacityMMTPA * ((100 - r.utilizationPct) / 100);
    return s + spareCapacity;
  }, 0);

  const canAbsorb = Math.min(shockMMTPA, totalSpare);
  const uncoveredGap = Math.max(0, shockMMTPA - canAbsorb);
  const absorptionPct = Math.round((canAbsorb / shockMMTPA) * 100);

  return (
    <div className="glass-surface rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="size-4 text-violet-400" />
        <p className="text-sm font-bold uppercase tracking-wider text-foreground">
          Import Substitution Calculator
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/60">
        Given a feedstock supply shock, how much can Singapore's refineries absorb using spare capacity and crude switching?
      </p>

      {/* Shock slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs font-semibold text-muted-foreground">Supply Shock (MMTPA lost)</label>
          <span className="text-sm font-black text-rose-400 tabular-nums">{shockMMTPA} MMTPA</span>
        </div>
        <input
          type="range"
          min={1}
          max={70}
          value={shockMMTPA}
          onChange={(e) => setShockMMTPA(Number(e.target.value))}
          className="w-full accent-rose-400"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground/50">
          <span>1 MMTPA</span>
          <span>70 MMTPA (100% capacity)</span>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
          <p className="text-xl font-black text-emerald-400">{canAbsorb.toFixed(1)}</p>
          <p className="text-[9px] text-muted-foreground mt-1">MMTPA Absorbable</p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
          <p className="text-xl font-black text-rose-400">{uncoveredGap.toFixed(1)}</p>
          <p className="text-[9px] text-muted-foreground mt-1">MMTPA Uncovered</p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
          <p className={`text-xl font-black ${absorptionPct >= 80 ? "text-emerald-400" : absorptionPct >= 50 ? "text-amber-400" : "text-rose-400"}`}>
            {absorptionPct}%
          </p>
          <p className="text-[9px] text-muted-foreground mt-1">Coverage Rate</p>
        </div>
      </div>

      {/* Refinery breakdown */}
      <div className="space-y-2">
        {SINGAPORE_REFINERIES.map((r) => {
          const spare = r.capacityMMTPA * ((100 - r.utilizationPct) / 100);
          const contribution = Math.min(spare, shockMMTPA * (r.capacityMMTPA / totalCapacity));
          const nciSufficient = r.nelsonComplexityIndex >= 11;
          return (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-foreground">{r.name}</p>
                <p className="text-[10px] text-muted-foreground/70">
                  NCI {r.nelsonComplexityIndex.toFixed(1)} ·{" "}
                  {nciSufficient
                    ? <span className="text-emerald-400">High complexity — can process alternate grades</span>
                    : <span className="text-amber-400">Moderate complexity — limited crude switching</span>}
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-bold text-emerald-400">+{contribution.toFixed(1)}</p>
                <p className="text-[9px] text-muted-foreground">MMTPA</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alternative sources */}
      <div className="pt-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Alternative Import Sources (Emergency)</p>
        <div className="space-y-2">
          {country.defaultAlternativeSources?.map((src: any) => (
            <div key={src.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-foreground/90">{src.name}</p>
                <p className="text-[10px] text-muted-foreground">{src.origin} · {src.grade} · {src.transitDays}d transit</p>
                {src.note && <p className="text-[9px] text-muted-foreground/60 mt-0.5 italic">{src.note}</p>}
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={`text-sm font-black tabular-nums ${src.priceDiffBbl >= 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {src.priceDiffBbl >= 0 ? "+" : ""}{src.priceDiffBbl.toFixed(1)} $/bbl
                </p>
                <div className="flex gap-0.5 mt-1 justify-end">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < src.availabilityScore ? "bg-emerald-400" : "bg-white/10"}`} />
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">{src.gradeCompatibility}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {uncoveredGap > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-3">
          <AlertTriangle className="size-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-300 leading-relaxed">
            Shortfall of <strong>{uncoveredGap.toFixed(1)} MMTPA</strong> cannot be absorbed via spare capacity alone.
            SPSS stock releases, EMA emergency product imports, or demand curtailment would be required.
          </p>
        </div>
      )}
    </div>
  );
}

// ── NCI Benchmark Chart ───────────────────────────────────────────────────────
function NCIBenchmarkChart() {
  const radarData = SINGAPORE_REFINERIES.map(r => ({
    refinery: r.name.replace(" Refinery", "").replace("Singapore Refining Company", "SRC"),
    nci: r.nelsonComplexityIndex,
    utilization: r.utilizationPct,
    capacity: r.capacityMMTPA,
    buffer: r.feedstockBuffer,
  }));

  return (
    <div className="glass-surface rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-violet-400" />
        <p className="text-sm font-bold uppercase tracking-wider text-foreground">
          Refinery Complexity Benchmark
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/60">
        Nelson Complexity Index (NCI) measures downstream sophistication. Higher = more upgrading capacity and feedstock flexibility.
        Global average ≈ 6.0; Singapore refineries significantly exceed this.
      </p>

      {/* Horizontal bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={radarData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            domain={[0, 18]}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "NCI", position: "insideBottomRight", fill: "rgba(255,255,255,0.3)", fontSize: 10, offset: -4 }}
          />
          <YAxis
            type="category"
            dataKey="refinery"
            width={95}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="nci" name="Nelson Complexity Index" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {radarData.map((entry, i) => (
              <Cell key={i} fill={PRODUCT_COLORS[i]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Context */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Global Average NCI", value: "~6.0", color: "text-muted-foreground" },
          { label: "Singapore Avg NCI", value: SG_AVG_NCI, color: "text-violet-400" },
          { label: "vs India Avg NCI", value: "~10.7", color: "text-amber-400" },
        ].map((b) => (
          <div key={b.label} className="bg-white/[0.03] rounded-lg border border-white/5 px-3 py-2">
            <p className="text-[9px] text-muted-foreground/60">{b.label}</p>
            <p className={`text-sm font-black ${b.color}`}>{b.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface Props { country: CountryProfile; }

export function SingaporeRefineryPage({ country }: Props) {
  const [selectedGrade, setSelectedGrade] = useState<SgCrudeGrade | null>(null);

  const throughputData = SINGAPORE_REFINERIES.map(r => ({
    name: r.name.replace(" Refinery", "").replace("Singapore Refining Company", "SRC"),
    capacity: r.capacityMMTPA,
    actual: parseFloat(((r.capacityMMTPA * r.utilizationPct) / 100).toFixed(1)),
    fill: ISLAND_COLORS[r.island] ?? "#60a5fa",
  }));

  return (
    <div className="space-y-5 p-6 bg-background">
      {/* Header */}
      <div className="glass-surface flex items-center justify-between rounded-xl border border-white/[0.06] p-5">
        <div className="flex items-center gap-3">
          <Factory className="size-6 text-primary" />
          <div>
            <p className="text-base font-black uppercase tracking-widest text-foreground">
              Singapore Refinery &amp; Processing
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {SINGAPORE_REFINERIES.length} refining complexes ·{" "}
              {SG_TOTAL_CAPACITY_MMTPA} MMTPA installed ·{" "}
              {(SG_TOTAL_CDU_BPD / 1000).toFixed(0)}k bpd crude distillation ·{" "}
              Avg NCI {SG_AVG_NCI}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tabular-nums text-rose-400">100%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Import dependent</p>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4">
        <StatCard label="Total Refining Capacity" value={`${SG_TOTAL_CAPACITY_MMTPA} MMTPA`}
          color="text-primary" icon={<Factory className="size-4" />} />
        <StatCard label="CDU Capacity" value={`${(SG_TOTAL_CDU_BPD / 1000).toFixed(0)}k bpd`}
          sub="Crude Distillation Units"
          color="text-sky-400" icon={<Droplets className="size-4" />} />
        <StatCard label="Avg Utilization" value={`${SG_AVG_UTIL}%`}
          sub="Weighted average"
          color="text-amber-400" icon={<Gauge className="size-4" />} />
        <StatCard label="Avg Nelson NCI" value={SG_AVG_NCI}
          sub="vs global avg ~6.0"
          color="text-violet-400" icon={<TrendingUp className="size-4" />} />
      </div>

      {/* Throughput Chart */}
      <div className="glass-surface rounded-xl border border-white/10 p-5 space-y-4">
        <p className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <BarChart2 className="size-4 text-primary" /> National Refinery Throughput
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          Installed capacity vs actual throughput at current utilization rates.
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={throughputData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              unit=" Mt"
              width={42}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }} />
            <Bar dataKey="capacity" name="Installed Capacity" fill="#3b82f6" fillOpacity={0.3} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="actual" name="Actual Throughput" fill="#10b981" fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>

        {/* Export summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
          {[
            { label: "Installed Capacity", val: `${SG_TOTAL_CAPACITY_MMTPA} MMTPA` },
            { label: "Domestic Demand", val: `${SG_REFINERY_THROUGHPUT_PROFILE.domesticConsumptionMMTPA} MMTPA` },
            { label: "Export Share", val: `${SG_REFINERY_THROUGHPUT_PROFILE.exportSharePct}%` },
            { label: "Marine Bunker Export", val: `${SG_REFINERY_THROUGHPUT_PROFILE.bunkering_export_MMTPA} MMTPA` },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xs font-black text-foreground">{s.val}</p>
              <p className="text-[9px] text-muted-foreground/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Refinery Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {SINGAPORE_REFINERIES.map((r, i) => (
          <RefineryCard key={r.id} refinery={r} rank={i + 1} />
        ))}
      </div>

      {/* NCI Benchmark */}
      <NCIBenchmarkChart />

      {/* Crude Compatibility Matrix */}
      <CrudeCompatibilityMatrix selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} />

      {/* Feedstock Supply Chain */}
      <FeedstockFlowPanel />

      {/* Disruption Impact */}
      <DisruptionImpactPanel />

      {/* Import Substitution Calculator */}
      <ImportSubstitutionCalculator country={country} />

      {/* Data source */}
      <p className="text-[9px] italic text-muted-foreground/30 text-center">
        {DATA_SOURCE_NOTE_SG}
      </p>
    </div>
  );
}
