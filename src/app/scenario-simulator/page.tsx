import type { Metadata } from "next";

import { ScenarioSimulator } from "@/features/scenario-simulator/components/ScenarioSimulator";

export const metadata: Metadata = {
  title: "Scenario Simulator | Smart Supply Chain Analyst",
  description:
    "Deterministic capacity-constrained scenario simulation for India's supply chain disruption analysis. Triangular range estimates, SSI composite scoring, and transparent assumption logging.",
};

export default function ScenarioSimulatorPage() {
  return <ScenarioSimulator />;
}
