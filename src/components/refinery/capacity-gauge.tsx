"use client";

import { useMemo } from "react";

type GaugeProps = {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  size?: number;
};

export function CapacityGauge({ value, max, label, sublabel, size = 200 }: GaugeProps) {
  const pct = Math.min((value / max) * 100, 110);
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const arc = (pct / 110) * circumference;

  const color = pct > 105 ? "#ef4444" : pct > 95 ? "#f59e0b" : "#10b981";

  const ticks = useMemo(() => {
    const arr: { angle: number; label: string }[] = [];
    for (let i = 0; i <= 110; i += 10) {
      arr.push({ angle: (i / 110) * 180 - 90, label: `${i}` });
    }
    return arr;
  }, []);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 5}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M 10 ${size / 2 + 5} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 5}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease, stroke 0.3s ease" }}
        />
        {/* Tick marks */}
        {ticks.map((t) => {
          const rad = (t.angle * Math.PI) / 180;
          const cx = size / 2;
          const cy = size / 2 + 5;
          const inner = radius - 16;
          const outer = radius - 10;
          return (
            <g key={t.label}>
              <line
                x1={cx + inner * Math.cos(rad)}
                y1={cy + inner * Math.sin(rad)}
                x2={cx + outer * Math.cos(rad)}
                y2={cy + outer * Math.sin(rad)}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              <text
                x={cx + (radius - 26) * Math.cos(rad)}
                y={cy + (radius - 26) * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize={8}
              >
                {t.label}
              </text>
            </g>
          );
        })}
        {/* Center value */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={28}
          fontWeight={700}
          fontFamily="ui-monospace, monospace"
        >
          {pct.toFixed(1)}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 16}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={10}
        >
          {value.toFixed(0)} of {max.toFixed(0)} MMTPA
        </text>
      </svg>
      <p className="mt-1 text-xs font-semibold text-foreground/80">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground/50">{sublabel}</p>}
    </div>
  );
}
