"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { getAllNodesByType } from "../../knowledge-graph/utils";

type Props = {
  affectedProductNames: string[];
};

const CustomDot = (props: { cx?: number; cy?: number; fill?: string }) => {
  const { cx = 0, cy = 0, fill } = props;
  return <circle cx={cx} cy={cy} r={6} fill={fill} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />;
};

export function ProductFlexibilityChart({ affectedProductNames }: Props) {
  const data = useMemo(() => {
    const allProducts = getAllNodesByType("product");

    return allProducts
      .filter((p) => {
        // Only include products that have real metadata AND are affected
        const hasData = (p.bufferDays ?? 0) > 0 || (p.flexibilityFactor ?? 0) > 0;
        const isAffected = affectedProductNames.some(
          (ap) =>
            ap.toLowerCase() === p.label.toLowerCase() ||
            p.aliases?.some((alias) => alias.toLowerCase() === ap.toLowerCase()) ||
            ap.toLowerCase().includes(p.label.toLowerCase()) ||
            p.label.toLowerCase().includes(ap.toLowerCase())
        );
        return hasData && isAffected;
      })
      .map((p) => ({
        name: p.label,
        // Short label for chart display
        shortName: p.label.length > 14 ? p.label.slice(0, 13) + "…" : p.label,
        flexibility: Math.round((p.flexibilityFactor ?? 0) * 100),
        buffer: p.bufferDays ?? 0,
        source: p.dataSource ?? "",
      }));
  }, [affectedProductNames]);

  if (data.length === 0) return null;

  const maxBuffer = Math.max(...data.map((d) => d.buffer), 30);
  const xDomain: [number, number] = [0, Math.ceil(maxBuffer * 1.2)];

  return (
    <div className="solid-card mt-5 rounded-xl border border-white/10 p-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Supply Chain Resilience
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Buffer inventory (days) vs. rerouting flexibility. Lower-left = highest risk.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> High Risk</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Resilient</span>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 30, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              dataKey="buffer"
              name="Buffer Days"
              domain={xDomain}
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              label={{
                value: "Buffer Inventory (Days)",
                position: "bottom",
                fill: "rgba(255,255,255,0.4)",
                fontSize: 10,
                offset: 10,
              }}
            />
            <YAxis
              type="number"
              dataKey="flexibility"
              name="Flexibility %"
              domain={[0, 70]}
              ticks={[0, 20, 40, 60]}
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              label={{
                value: "Rerouting Flex %",
                angle: -90,
                position: "insideLeft",
                fill: "rgba(255,255,255,0.4)",
                fontSize: 10,
                offset: 10,
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const isHighRisk = d.buffer < 15 && d.flexibility < 30;
                const isMedium = d.buffer < 30 && d.flexibility < 50 && !isHighRisk;
                return (
                  <div className="rounded-lg border border-white/10 bg-[#0e1319] px-3 py-2 text-xs shadow-xl max-w-[220px]">
                    <div className="font-semibold text-foreground mb-1">{d.name}</div>
                    <div className="text-muted-foreground">
                      Buffer: <span className="text-slate-200 font-medium">{d.buffer} days</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      Flexibility: <span className="text-slate-200 font-medium">{d.flexibility}%</span>
                    </div>
                    <div className={`mt-1.5 text-[10px] font-semibold ${isHighRisk ? "text-red-400" : isMedium ? "text-amber-400" : "text-blue-400"}`}>
                      {isHighRisk ? "⚠ HIGH RISK — low buffer, low alternatives" : isMedium ? "⚡ MEDIUM RISK" : "✓ Relatively Resilient"}
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={data} shape={<CustomDot />}>
              {data.map((entry, index) => {
                const isHighRisk = entry.buffer < 15 && entry.flexibility < 30;
                const isMediumRisk = entry.buffer < 30 && entry.flexibility < 50 && !isHighRisk;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighRisk ? "#ef4444" : isMediumRisk ? "#eab308" : "#3b82f6"}
                  />
                );
              })}
              <LabelList
                dataKey="shortName"
                position="top"
                style={{ fill: "rgba(255,255,255,0.65)", fontSize: 9 }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-[9px] text-muted-foreground/50 text-right">
        * Sources: MoPNG, PPAC, CEA, IESA, IPA-FICCI, FAI, SEA India — cited per commodity node.
      </div>
    </div>
  );
}
