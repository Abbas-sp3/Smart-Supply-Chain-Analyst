import type { Metadata } from "next";

import { IntelligenceDashboard } from "@/features/geopolitical-intelligence/components/IntelligenceDashboard/intelligence-dashboard";

export const metadata: Metadata = {
  title: "Geopolitical Intelligence | Smart Supply Chain Analyst",
  description:
    "AI-powered geopolitical and supply chain intelligence for national import ecosystems.",
};

export default function GeopoliticalRiskPage() {
  return <IntelligenceDashboard />;
}
