import { Zap, Leaf, Factory, Hexagon } from "lucide-react";
import React from "react";

export const CATEGORY_META: Record<string, { label: string; badge: string; icon: React.ElementType; border: string }> = {
  energy: {
    label: "Energy",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    icon: Zap,
    border: "border-l-amber-500/50",
  },
  food_agriculture: {
    label: "Food & Agriculture",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: Leaf,
    border: "border-l-emerald-500/50",
  },
  manufacturing: {
    label: "Manufacturing",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    icon: Factory,
    border: "border-l-blue-500/50",
  },
  multi_sector: {
    label: "Multi-Sector",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    icon: Hexagon,
    border: "border-l-violet-500/50",
  },
};

export const SEVERITY_COLOR = (pct: number) => {
  if (pct >= 80) return "text-red-400";
  if (pct >= 50) return "text-orange-400";
  if (pct >= 25) return "text-yellow-400";
  return "text-emerald-400";
};
