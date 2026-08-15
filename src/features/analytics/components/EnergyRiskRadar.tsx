"use client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// Ported from carbon-evolution/horus RiskRadar — adapted for energy supply chain axes.
export interface RadarAxis {
  axis: string;
  value: number; // 0–100
}

type Anchor = "start" | "middle" | "end";
type TickProps = { x?: number; y?: number; textAnchor?: Anchor; payload?: { value?: string } };

function AxisTick({ x = 0, y = 0, textAnchor = "middle", payload }: TickProps) {
  const words = String(payload?.value ?? "").split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 14) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  const dy = -((lines.length - 1) * 5.5) / 2;
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill="#8695ab" fontSize={10}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? dy : 11}>{l}</tspan>
      ))}
    </text>
  );
}

export function EnergyRiskRadar({ data }: { data: RadarAxis[] }) {
  const avg = data.reduce((s, d) => s + d.value, 0) / (data.length || 1);
  const level = avg >= 70 ? "High" : avg >= 45 ? "Medium" : "Low";
  const levelColor = avg >= 70 ? "#ef4444" : avg >= 45 ? "#f59e0b" : "#34d399";
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius="62%" margin={{ top: 12, right: 78, bottom: 12, left: 78 }}>
          <PolarGrid stroke="#233149" />
          <PolarAngleAxis dataKey="axis" tick={<AxisTick />} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Risk" dataKey="value" stroke={levelColor} fill={levelColor} fillOpacity={0.28} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />Low Risk</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />Medium Risk</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />High Risk</span>
      </div>
      <div className="mt-2 text-center text-xs text-[var(--text-dim)]">
        Composite risk: <span className="font-semibold" style={{ color: levelColor }}>{level} ({avg.toFixed(0)}/100)</span>
      </div>
    </div>
  );
}
