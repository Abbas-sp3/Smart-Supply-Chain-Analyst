"use client";
import { useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { RadarAxis } from "./EnergyRiskRadar";

// Ported from carbon-evolution/horus RiskRadarCompare — adapted for energy supply chain entities.
export interface CompareRadarSeries {
  entity: string; // e.g., "Saudi Arabia", "Iraq"
  color: string;
  axes: RadarAxis[];
}

const COMPOSITE = "Sector Benchmark";

export function EnergyRiskCompare({ compareRadar: series }: { compareRadar: CompareRadarSeries[] }) {
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const focus = hovered ?? pinned;

  const entities = series.filter((s) => s.entity !== COMPOSITE);
  const composite = series.find((s) => s.entity === COMPOSITE);

  const axes = series[0]?.axes.map((a) => a.axis) ?? [];
  const rows = axes.map((axis, i) => {
    const row: Record<string, string | number> = { axis };
    for (const s of series) row[s.entity] = s.axes[i]?.value ?? 0;
    return row;
  });

  const styleFor = (entity: string) => {
    if (!focus) return { stroke: 0.3, fill: 0, width: 1.2 };
    if (entity === focus) return { stroke: 1, fill: 0.2, width: 2.6 };
    return { stroke: 0.05, fill: 0, width: 1 };
  };

  const focused = focus ? series.find((s) => s.entity === focus) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-[var(--text)]">Comparative Risk Profiles</h3>
        <p className="text-sm text-[var(--text-dim)]">
          Side-by-side risk profiles across top energy suppliers. Hover to isolate; click to pin. Dashed line is the global benchmark.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
        <div className="mb-4 flex flex-wrap gap-2">
          {entities.map((s) => {
            const isFocus = focus === s.entity;
            const dim = focus && !isFocus;
            return (
              <button
                key={s.entity}
                onMouseEnter={() => setHovered(s.entity)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setPinned((p) => (p === s.entity ? null : s.entity))}
                aria-pressed={pinned === s.entity}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  pinned === s.entity ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[#0b0f1a]" : ""
                } ${dim ? "opacity-40" : "opacity-100"}`}
                style={
                  isFocus
                    ? { background: `${s.color}33`, color: s.color, borderColor: `${s.color}99` }
                    : { borderColor: "var(--panel-border)", color: "var(--text-dim)", background: "var(--panel)" }
                }
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.entity}
              </button>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={480}>
          <RadarChart data={rows} outerRadius="75%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#233149" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#8695ab", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {entities.map((s) => {
              const st = styleFor(s.entity);
              return (
                <Radar
                  key={s.entity}
                  name={s.entity}
                  dataKey={s.entity}
                  stroke={s.color}
                  strokeOpacity={st.stroke}
                  strokeWidth={st.width}
                  fill={s.color}
                  fillOpacity={st.fill}
                  isAnimationActive={false}
                />
              );
            })}
            {composite && (
              <Radar
                name={COMPOSITE}
                dataKey={COMPOSITE}
                stroke={composite.color}
                strokeOpacity={focus ? 0.35 : 0.6}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                fill="none"
                isAnimationActive={false}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>

        {focused && focused.entity !== COMPOSITE && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[var(--panel-border)] pt-4 text-xs">
            <span className="font-semibold text-sm" style={{ color: focused.color }}>{focused.entity}</span>
            {focused.axes.map((a) => (
              <span key={a.axis} className="text-[var(--text-dim)]">
                {a.axis}: <span className="font-semibold text-[var(--text)]">{a.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
