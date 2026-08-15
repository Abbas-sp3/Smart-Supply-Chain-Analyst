"use client";

import { PieChart } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from "recharts";
import { useCountry } from "@/hooks/useCountry";

// Helper to deterministically generate a color based on supplier name
function getSupplierColor(name: string): string {
  // Common standard colors
  const colorMap: Record<string, string> = {
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
    Malaysia: "#10b981",      // Emerald 500
    "Middle East": "#f97316", // Orange 500
    "West Africa": "#d946ef", // Fuchsia 500
  };

  if (colorMap[name]) return colorMap[name];

  // Hash string to generate a reproducible HSL color for unknown countries
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 60%)`;
}

export function ImportDependencyMetrics() {
  const { activeCountry } = useCountry();
  const { supplierMix } = activeCountry.energyProfile;

  // Convert supplierMix to recharts format
  // Example result: [{ name: "Crude", Russia: 35, Iraq: 20 }, { name: "LNG", Qatar: 45 }]
  const chartData = supplierMix.map(mix => {
    const dataPoint: any = { name: mix.commodity };
    mix.suppliers.forEach(s => {
      dataPoint[s.name] = s.pct;
    });
    return dataPoint;
  });

  // Extract all unique suppliers to define the <Bar> components dynamically
  const uniqueSuppliers = Array.from(new Set(
    supplierMix.flatMap(mix => mix.suppliers.map(s => s.name))
  ));

  return (
    <div className="h-full flex flex-col relative gap-4">
      <div className="flex items-center gap-2 mb-2 px-1 z-10">
        <PieChart className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier Concentration</span>
      </div>

      <div className="flex-1 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden min-h-[220px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
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
            
            {uniqueSuppliers.map((supplierName) => (
              <Bar 
                key={supplierName} 
                dataKey={supplierName} 
                stackId="a" 
                fill={getSupplierColor(supplierName)} 
                isAnimationActive={true}
              >
                <LabelList
                  dataKey={supplierName}
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
                        {supplierName}
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
