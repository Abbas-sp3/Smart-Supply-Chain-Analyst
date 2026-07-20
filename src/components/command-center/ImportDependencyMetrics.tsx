"use client";

import { PieChart } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from "recharts";

const DATA = [
  { 
    name: "Crude", 
    Russia: 35, Iraq: 20, "Saudi Arabia": 15, UAE: 10, Others: 20 
  },
  { 
    name: "LNG", 
    Qatar: 45, USA: 15, UAE: 12, Others: 28 
  },
  { 
    name: "Coal", 
    Indonesia: 45, Australia: 25, "South Africa": 15, Others: 15 
  },
];

const COLORS: Record<string, string> = {
  Russia: "#f43f5e",        // Rose 500
  Iraq: "#fb7185",          // Rose 400
  "Saudi Arabia": "#fda4af", // Rose 300
  Qatar: "#3b82f6",         // Blue 500
  USA: "#60a5fa",           // Blue 400
  UAE: "#818cf8",           // Indigo 400
  Indonesia: "#eab308",     // Yellow 500
  Australia: "#fde047",     // Yellow 300
  "South Africa": "#fef08a", // Yellow 200
  Others: "#3f3f46",        // Zinc 700
};

const COUNTRIES = [
  "Russia", "Iraq", "Saudi Arabia", "Qatar", "USA", "UAE", "Indonesia", "Australia", "South Africa", "Others"
];

export function ImportDependencyMetrics() {
  return (
    <div className="h-full flex flex-col relative gap-4">
      <div className="flex items-center gap-2 mb-2 px-1 z-10">
        <PieChart className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier Concentration</span>
      </div>

      <div className="flex-1 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden min-h-[220px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={DATA}
            layout="vertical"
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#a1a1aa", fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', fontSize: '12px' }}
              itemStyle={{ color: '#e4e4e7' }}
              formatter={(value: any, name: any) => [`${value}%`, name]}
              itemSorter={(item) => -(item.value as number)}
            />
            
            {COUNTRIES.map((country) => (
              <Bar 
                key={country} 
                dataKey={country} 
                stackId="a" 
                fill={COLORS[country]} 
                isAnimationActive={true}
              >
                <LabelList
                  dataKey={country}
                  content={(props: any) => {
                    const { x, y, width, height, value } = props;
                    if (!value || width < 45) return null; // hide if segment is too narrow
                    return (
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        fill="#fff"
                        fontSize={9}
                        fontWeight={600}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}
                      >
                        {country}
                      </text>
                    );
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Note */}
      <div className="mt-1 px-2 text-[9px] uppercase tracking-widest text-muted-foreground text-center">
        Shows % of total imports per commodity
      </div>
    </div>
  );
}
