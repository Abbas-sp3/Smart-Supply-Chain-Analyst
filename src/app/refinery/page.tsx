"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Factory, RefreshCw, BarChart3, AlertTriangle, Fuel,
  ShieldAlert, CheckCircle2, Wrench, ChevronDown, ChevronUp,
  Building2, MapPin, Calendar, Gauge, TrendingUp, ArrowUpRight,
  Calculator, Globe2, Link2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie,
} from "recharts";
import { CapacityGauge } from "@/components/refinery/capacity-gauge";
import { ImportSubstitutionCalculator } from "@/components/refinery/import-substitution";
import { RefineryVulnerabilityMap } from "@/components/refinery/vulnerability-map";
import { CrudeCompatibilityPanel } from "@/components/refinery/crude-compatibility-panel";


// ── Types ──────────────────────────────────────────────────────────
type RefineryRecord = {
  name: string;
  owner: string;
  sector: string;
  state: string;
  location: string;
  commissioned: string;
  capacityMMTPA: number;
  expandingToMMTPA?: number;
  nelsonComplexityIndex: number | null;
};

type RefineryWithStatus = RefineryRecord & {
  id: string;
  status: string;
  region: string;
  utilizationPct: number;
  crudeGrades: string[];
  products: { name: string; pctOfOutput: number }[];
  bufferDays: number;
};

type Cluster = {
  region: string;
  label: string;
  refineries: RefineryWithStatus[];
  totalCapacityMMTPA: number;
};

type Scenario = {
  id: string;
  name: string;
  description: string;
  affectedRefineryNames: string[];
  severityImpactPct: number;
  durationDays: number;
};

type Impact = {
  scenarioId: string;
  affectedRefineries: { name: string; lostCapacityMMTPA: number }[];
  totalLostCapacityMMTPA: number;
  nationalCapacityAfter: number;
  supplyGapPct: number;
  fuelShortageDays: number;
  estimatedPriceImpactPct: number;
  affectedProducts: { name: string; shortagePct: number }[];
};

type DashboardData = {
  refineries: RefineryWithStatus[];
  clusters: Cluster[];
  nationalStats: {
    totalCapacityMMTPA: number;
    operationalCount: number;
    expandingCount: number;
    totalRefineries: number;
    avgNelsonComplexity: number;
  };
  crudeCompatibility: {
    grades: { name: string; origin: string; api: number; sulfur: number; type: string }[];
    matrix: Record<string, string[]>;
  };
  scenarios: Scenario[];
  dataSource: string;
};

const REGION_COLORS: Record<string, string> = {
  west: "#f59e0b",
  south: "#10b981",
  east: "#3b82f6",
  north: "#8b5cf6",
  northeast: "#ec4899",
};

const SECTOR_COLORS: Record<string, string> = {
  Public: "#3b82f6",
  Private: "#f59e0b",
  "Joint Venture": "#10b981",
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  operational: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: "Operational" },
  expanding: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", label: "Expanding" },
  legacy: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Legacy" },
};

function fmtDate(d: string): string {
  if (!d) return "\u2014";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function getAge(d: string): number {
  return new Date().getFullYear() - new Date(d).getFullYear();
}

// ── Page ───────────────────────────────────────────────────────────
export default function RefineryPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [expandedRefinery, setExpandedRefinery] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [impact, setImpact] = useState<Impact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [compatGrade, setCompatGrade] = useState("");
  const [compatRefinery, setCompatRefinery] = useState("");
  const [sortBy, setSortBy] = useState<"capacity" | "nci" | "name" | "commissioned">("capacity");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/refinery");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch { /* keep null */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);



  const runScenario = useCallback(async (scenarioId: string) => {
    setImpactLoading(true);
    setImpact(null);
    try {
      const res = await fetch(`/api/refinery?scenario=${scenarioId}`);
      if (res.ok) { const json = await res.json(); setImpact(json.impact); }
    } catch { /* keep null */ } finally {
      setImpactLoading(false);
    }
  }, []);

  if (!data) {
    return (
      <div className="space-y-4 p-6 bg-background">
        <div className="glass-surface flex items-center gap-3 rounded-xl border border-white/[0.06] p-4">
          <Factory className="size-5 text-primary" />
          <p className="text-sm font-semibold uppercase tracking-widest">Refinery &amp; Processing</p>
        </div>
        <div className="glass-surface rounded-xl border border-white/10 p-5 text-sm text-muted-foreground">
          {loading ? "Loading refinery data..." : "No refinery data available."}
        </div>
      </div>
    );
  }

  const { clusters, nationalStats, crudeCompatibility, scenarios, dataSource } = data;
  const filteredClusters = selectedRegion === "all" ? clusters : clusters.filter((c) => c.region === selectedRegion);
  const allRefineries = filteredClusters.flatMap((c) => c.refineries);

  const sorted = [...allRefineries].sort((a, b) => {
    if (sortBy === "capacity") return b.capacityMMTPA - a.capacityMMTPA;
    if (sortBy === "nci") return (b.nelsonComplexityIndex ?? 0) - (a.nelsonComplexityIndex ?? 0);
    if (sortBy === "commissioned") return new Date(a.commissioned).getTime() - new Date(b.commissioned).getTime();
    return a.name.localeCompare(b.name);
  });

  const capacityByRegion = clusters.map((c) => ({
    name: c.label,
    capacity: c.totalCapacityMMTPA,
    color: REGION_COLORS[c.region] ?? "#666",
  }));

  const sectorData = Object.entries(
    allRefineries.reduce((acc, r) => { acc[r.sector] = (acc[r.sector] ?? 0) + r.capacityMMTPA; return acc; }, {} as Record<string, number>),
  ).map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }));

  return (
    <div className="space-y-4 p-6 bg-background">
      {/* Header */}
      <div className="glass-surface flex items-center justify-between rounded-xl border border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <Factory className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest">Refinery &amp; Processing</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {nationalStats.totalRefineries} operational refineries &middot; {nationalStats.totalCapacityMMTPA} MMTPA installed capacity &middot; Avg NCI {nationalStats.avgNelsonComplexity}
            </p>
          </div>
        </div>
        <button type="button" onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-foreground/90 hover:bg-white/5 disabled:opacity-50">
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* National Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Total Capacity", value: `${nationalStats.totalCapacityMMTPA} MMTPA`, icon: <Factory className="size-4" />, color: "text-primary" },
          { label: "Operational", value: `${nationalStats.operationalCount}`, icon: <CheckCircle2 className="size-4" />, color: "text-emerald-400" },
          { label: "Expanding", value: `${nationalStats.expandingCount}`, icon: <TrendingUp className="size-4" />, color: "text-blue-400" },
          { label: "Avg NCI", value: `${nationalStats.avgNelsonComplexity}`, icon: <Gauge className="size-4" />, color: "text-amber-400" },
          { label: "Refineries", value: `${nationalStats.totalRefineries}`, icon: <Building2 className="size-4" />, color: "text-foreground/70" },
        ].map((s) => (
          <div key={s.label} className="glass-surface rounded-xl border border-white/10 p-3">
            <div className="flex items-center gap-2">
              <span className={s.color}>{s.icon}</span>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
            <p className="mt-1 text-lg font-bold text-foreground numeric">{s.value}</p>
          </div>
        ))}
      </div>

      {/* National Capacity Gauge */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">National Capacity Utilization</p>
        </div>
        <div className="flex justify-center">
          <CapacityGauge
            value={allRefineries.reduce((s, r) => s + r.capacityMMTPA * (r.utilizationPct / 100), 0)}
            max={nationalStats.totalCapacityMMTPA}
            label="Refining capacity in use"
            sublabel={`Operational throughput across ${allRefineries.length} refineries`}
            size={240}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-surface rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="size-4 text-muted-foreground" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">Capacity by Region</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityByRegion} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#0f1c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#f0f4f8" }} formatter={(value) => [`${value} MMTPA`]} />
                <Bar dataKey="capacity" radius={[4, 4, 0, 0]} barSize={36}>
                  {capacityByRegion.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-surface rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Fuel className="size-4 text-muted-foreground" />
            <p className="text-sm font-bold uppercase tracking-widest text-foreground">Sector Split (Capacity)</p>
          </div>
          <div className="h-52 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name">
                  {sectorData.map((e, i) => <Cell key={i} fill={SECTOR_COLORS[e.name] ?? "#666"} fillOpacity={0.8} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f1c28", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#f0f4f8" }} formatter={(value) => [`${value} MMTPA`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {sectorData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[s.name] }} />
                  <span className="text-xs text-foreground/70">{s.name}</span>
                  <span className="text-[10px] text-muted-foreground/50 numeric">{s.value} MMTPA</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Refinery Vulnerability Map */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe2 className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">Refinery Vulnerability Map</p>
        </div>
        <p className="text-[11px] text-muted-foreground/60 mb-3">
          Sized by capacity. Red = west coast (high Hormuz exposure). Click a dot for details.
        </p>
        <RefineryVulnerabilityMap refineries={allRefineries} />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {["all", "west", "south", "east", "north", "northeast"].map((r) => (
            <button key={r} type="button" onClick={() => setSelectedRegion(r)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all ${
                selectedRegion === r ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"
              }`}>
              {r === "all" ? "All" : r === "west" ? "West" : r === "south" ? "South" : r === "east" ? "East" : r === "north" ? "North" : "NE"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase text-muted-foreground/40">Sort:</span>
          {([["capacity", "Capacity"], ["nci", "NCI"], ["commissioned", "Year"], ["name", "Name"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setSortBy(key)}
              className={`rounded border px-2 py-0.5 text-[10px] transition-all ${
                sortBy === key ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Refinery Table */}
      <div className="glass-surface rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                {["#", "Refinery", "Owner", "Sector", "State", "Commissioned", "Capacity (MMTPA)", "Expanding To", "NCI", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-[9px] uppercase tracking-wider text-muted-foreground/50 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, idx) => {
                const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.operational;
                const age = getAge(r.commissioned);
                const isExpanded = expandedRefinery === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className={`border-b border-white/5 ${isExpanded ? "bg-white/[0.02]" : "hover:bg-white/[0.02]"}`}>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground/40 numeric">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => setExpandedRefinery(isExpanded ? null : r.id)} className="flex items-center gap-1.5 text-left">
                        <span className="text-xs font-medium text-foreground/90">{r.name}</span>
                        <span className="text-muted-foreground/30">{isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-foreground/60 whitespace-nowrap">{r.owner}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-foreground/60 border border-white/5">{r.sector}</span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-foreground/60">{r.state}</td>
                    <td className="px-3 py-2 text-[11px] text-foreground/50 numeric whitespace-nowrap">{fmtDate(r.commissioned)} <span className="text-muted-foreground/30">({age}y)</span></td>
                    <td className="px-3 py-2 text-xs font-bold text-foreground numeric">{r.capacityMMTPA}</td>
                    <td className="px-3 py-2">
                      {r.expandingToMMTPA ? (
                        <span className="flex items-center gap-1 text-[11px] text-blue-400 numeric font-medium">
                          {r.expandingToMMTPA} <ArrowUpRight className="size-3" />
                        </span>
                      ) : <span className="text-[10px] text-muted-foreground/30">\u2014</span>}
                    </td>
                    <td className="px-3 py-2 text-[11px] numeric text-foreground/70">{r.nelsonComplexityIndex ?? "\u2014"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-white/10 bg-white/[0.01]">
                      <td colSpan={10} className="p-0">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                              <p className="text-[9px] uppercase text-muted-foreground/40">Commissioned</p>
                              <p className="text-xs font-medium text-foreground/80">{fmtDate(r.commissioned)}</p>
                              <p className="text-[9px] text-muted-foreground/30">{getAge(r.commissioned)} years old</p>
                            </div>
                            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                              <p className="text-[9px] uppercase text-muted-foreground/40">Current Capacity</p>
                              <p className="text-xs font-medium text-foreground/80 numeric">{r.capacityMMTPA} MMTPA</p>
                            </div>
                            {r.expandingToMMTPA && (
                              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                                <p className="text-[9px] uppercase text-muted-foreground/40">Expanding To</p>
                                <p className="text-xs font-medium text-blue-400 numeric">{r.expandingToMMTPA} MMTPA</p>
                                <p className="text-[9px] text-blue-400/50">+{(r.expandingToMMTPA - r.capacityMMTPA).toFixed(1)} MMTPA (+{Math.round(((r.expandingToMMTPA - r.capacityMMTPA) / r.capacityMMTPA) * 100)}%)</p>
                              </div>
                            )}
                            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                              <p className="text-[9px] uppercase text-muted-foreground/40">Nelson Complexity</p>
                              <p className="text-xs font-medium text-foreground/80 numeric">{r.nelsonComplexityIndex ?? "N/A"}</p>
                              <p className="text-[9px] text-muted-foreground/30">{r.nelsonComplexityIndex ? (r.nelsonComplexityIndex >= 12 ? "High complexity" : r.nelsonComplexityIndex >= 9 ? "Medium complexity" : "Low complexity") : ""}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground/50 mb-1.5">Compatible Crude Grades</p>
                            <div className="flex flex-wrap gap-1.5">
                              {r.crudeGrades.map((g) => (
                                <span key={g} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-foreground/60 border border-white/5">{g}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground/50 mb-1.5">Typical Product Output</p>
                            <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
                              {r.products.map((p) => (
                                <div key={p.name} className="flex items-center gap-2">
                                  <div className="h-1.5 rounded-full bg-primary/40" style={{ width: `${p.pctOfOutput}%`, minWidth: 4 }} />
                                  <span className="text-[10px] text-foreground/70 flex-1">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground/50 numeric">{p.pctOfOutput}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-white/[0.02]">
              <td className="px-3 py-2 text-[9px] text-muted-foreground/40 font-medium" colSpan={6}>TOTAL ({sorted.length} refineries)</td>
              <td className="px-3 py-2 text-xs font-bold text-primary numeric">{sorted.reduce((s, r) => s + r.capacityMMTPA, 0).toFixed(1)}</td>
              <td className="px-3 py-2 text-[11px] text-blue-400 numeric font-medium">
                {sorted.filter((r) => r.expandingToMMTPA).reduce((s, r) => s + (r.expandingToMMTPA ?? 0) - r.capacityMMTPA, 0).toFixed(1)} MMTPA expansion
              </td>
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

      {/* Crude Compatibility */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Fuel className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">Crude-Refinery Compatibility</p>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div>
            <p className="text-[9px] uppercase text-muted-foreground/40 mb-1">Crude Grade</p>
            <select value={compatGrade} onChange={(e) => { setCompatGrade(e.target.value); setCompatRefinery(""); }}
              className="rounded-lg border border-white/10 bg-[#0f1c28] px-3 py-1.5 text-xs text-foreground/80 outline-none focus:border-primary/30">
              <option value="" className="bg-[#0f1c28] text-foreground/80">Select crude...</option>
              {crudeCompatibility.grades.map((g) => (
                <option key={g.name} value={g.name} className="bg-[#0f1c28] text-foreground/80">{g.name} ({g.origin}, API {g.api}, {g.sulfur}% S)</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[9px] uppercase text-muted-foreground/40 mb-1">Or refinery</p>
            <select value={compatRefinery} onChange={(e) => { setCompatRefinery(e.target.value); setCompatGrade(""); }}
              className="rounded-lg border border-white/10 bg-[#0f1c28] px-3 py-1.5 text-xs text-foreground/80 outline-none focus:border-primary/30">
              <option value="" className="bg-[#0f1c28] text-foreground/80">Select refinery...</option>
              {sorted.map((r) => (
                <option key={r.name} value={r.name} className="bg-[#0f1c28] text-foreground/80">{r.name} ({r.owner})</option>
              ))}
            </select>
          </div>
        </div>
        {compatGrade && (
          <div className="space-y-2">
            <p className="text-xs text-foreground/70"><span className="font-semibold text-foreground/80">{compatGrade}</span> compatible at:</p>
            <div className="flex flex-wrap gap-1.5">
              {sorted.filter((r) => crudeCompatibility.matrix[r.name]?.includes(compatGrade)).map((r) => (
                <span key={r.name} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">{r.name}</span>
              ))}
            </div>
          </div>
        )}
        {compatRefinery && (
          <div className="space-y-2">
            <p className="text-xs text-foreground/70">Crude grades for <span className="font-semibold text-foreground/80">{compatRefinery}</span>:</p>
            <div className="flex flex-wrap gap-1.5">
              {(crudeCompatibility.matrix[compatRefinery] ?? []).map((g) => (
                <span key={g} className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] text-primary">{g}</span>
              ))}
            </div>
          </div>
        )}
        {!compatGrade && !compatRefinery && <p className="text-[10px] text-muted-foreground/40 italic">Select a crude grade or refinery above.</p>}
      </div>

      {/* Disruption Simulator */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">Disruption Impact Simulator</p>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 mb-4">
          {scenarios.map((s) => (
            <button key={s.id} type="button" onClick={() => { setSelectedScenario(s.id); runScenario(s.id); }}
              className={`rounded-lg border p-3 text-left transition-all ${selectedScenario === s.id ? "border-red-500/30 bg-red-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"}`}>
              <p className="text-xs font-semibold text-foreground">{s.name}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/60 leading-relaxed">{s.description}</p>
              <div className="mt-2 flex items-center gap-3 text-[9px] text-muted-foreground/40">
                <span>Severity: {s.severityImpactPct}%</span>
                <span>Duration: {s.durationDays}d</span>
                <span>Affected: {s.affectedRefineryNames.length} refineries</span>
              </div>
            </button>
          ))}
        </div>
        {impactLoading && <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-muted-foreground">Simulating...</div>}
        {impact && !impactLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-[9px] uppercase text-muted-foreground/50">Capacity Lost</p>
                <p className="text-lg font-bold text-red-400 numeric">{impact.totalLostCapacityMMTPA} <span className="text-[9px] font-normal">MMTPA</span></p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-[9px] uppercase text-muted-foreground/50">Supply Gap</p>
                <p className="text-lg font-bold text-red-400 numeric">{impact.supplyGapPct}%</p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[9px] uppercase text-muted-foreground/50">Fuel Shortage</p>
                <p className="text-lg font-bold text-amber-400 numeric">{impact.fuelShortageDays} <span className="text-[9px] font-normal">days</span></p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[9px] uppercase text-muted-foreground/50">Price Impact</p>
                <p className="text-lg font-bold text-amber-400 numeric">+{impact.estimatedPriceImpactPct}%</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground/50 mb-2">Affected Refineries</p>
              <div className="space-y-1.5">
                {impact.affectedRefineries.map((r) => (
                  <div key={r.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    <span className="text-xs text-foreground/80">{r.name}</span>
                    <span className="text-xs text-red-400 numeric">-{r.lostCapacityMMTPA} MMTPA</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground/50 mb-2">Product Shortage</p>
              <div className="space-y-1.5">
                {impact.affectedProducts.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-foreground/70 w-32">{p.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-red-500/60" style={{ width: `${Math.min(p.shortagePct * 2, 100)}%` }} />
                    </div>
                    <span className="text-[10px] text-red-400 numeric w-12 text-right">-{p.shortagePct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Substitution Calculator */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="size-4 text-muted-foreground" />
          <p className="text-sm font-bold uppercase tracking-widest text-foreground">Import Substitution Calculator</p>
        </div>
        <p className="text-[11px] text-muted-foreground/60 mb-3">
          Given a supply shock (e.g. lose 20 MMTPA of Gulf crude), which refineries can absorb it using spare capacity and crude switching flexibility?
        </p>
        <ImportSubstitutionCalculator refineries={allRefineries} />
      </div>

      {/* Crude Compatibility Panel */}
      <div className="glass-surface rounded-xl border border-white/10 p-4">
        <CrudeCompatibilityPanel refineries={allRefineries} highlightGrade={compatGrade || undefined} />
      </div>

      {/* Data Source */}
      <p className="text-[9px] italic text-muted-foreground/30 text-center">{dataSource}</p>
    </div>
  );
}
