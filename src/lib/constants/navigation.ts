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
    enabled: false,
  },
  {
    id: "procurement",
    label: "Procurement",
    href: "/procurement",
    icon: Package,
    enabled: false,
  },
  {
    id: "scenario-simulator",
    label: "Scenario Simulator",
    href: "/scenario-simulator",
    icon: FlaskConical,
    enabled: false,
  },
  {
    id: "refinery",
    label: "Refinery",
    href: "/refinery",
    icon: Factory,
    enabled: false,
  },
  {
    id: "strategic-reserve",
    label: "Strategic Reserve",
    href: "/strategic-reserve",
    icon: Globe2,
    enabled: false,
  },
  {
    id: "historical-replay",
    label: "Historical Replay",
    href: "/historical-replay",
    icon: Clock3,
    enabled: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    enabled: false,
  },
];
