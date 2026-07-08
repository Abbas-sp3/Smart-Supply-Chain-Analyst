import type { Metadata } from "next";

import { IntelligenceDashboard } from "@/features/geopolitical-intelligence/components/IntelligenceDashboard/intelligence-dashboard";

export const metadata: Metadata = {
  title: "Geopolitical Intelligence | Smart Supply Chain Analyst",
  description:
    "AI-powered geopolitical and supply chain intelligence for India's import ecosystem.",
};

export default function GeopoliticalRiskPage() {
  return <IntelligenceDashboard />;
}
