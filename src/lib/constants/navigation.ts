import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Clock3,
  Factory,
  FlaskConical,
  Globe2,
  LayoutDashboard,
  Package,
  ShieldAlert,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Command Center",
    href: "/",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    id: "geopolitical-risk",
    label: "Geopolitical Risk",
    href: "/geopolitical-risk",
    icon: ShieldAlert,
    enabled: true,
  },
  {
    id: "procurement",
    label: "Energy Procurement",
    href: "/procurement",
    icon: Package,
    enabled: true,
  },
  {
    id: "scenario-simulator",
    label: "Scenario Simulator",
    href: "/scenario-simulator",
    icon: FlaskConical,
    enabled: true,
  },
  {
    id: "refinery",
    label: "Refinery & Processing",
    href: "/refinery",
    icon: Factory,
    enabled: true,
  },
  {
    id: "strategic-reserve",
    label: "Energy Reserves",
    href: "/strategic-reserve",
    icon: Globe2,
    enabled: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    enabled: true
  },
];
