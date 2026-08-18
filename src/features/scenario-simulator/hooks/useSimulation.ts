"use client";

import { useState, useCallback, useRef } from "react";
import type {
  PropagationResult,
  DecisionLever,
} from "@/features/scenario-simulator/types";
import { useCountry } from "@/hooks/useCountry";
import { CountryProfile } from "@/data/countries/types";
import type { MonteCarloResult } from "@/app/(dashboard)/api/monte-carlo/route";


export type SimulationRun = {
  result: PropagationResult;
  levers: DecisionLever[];
  label: string; // "Baseline" | "With levers"
  monteCarloData?: MonteCarloResult | null;  // null if Python server was offline
};

export type UseSimulationReturn = {
  baseline: SimulationRun | null;
  withLevers: SimulationRun | null;
  loading: boolean;
  error: string | null;
  runBaseline: (presetId: string) => Promise<void>;
  runWithLevers: (presetId: string, levers: DecisionLever[]) => Promise<void>;
  reset: () => void;
};

/**
 * Fetches dynamic Monte Carlo severity from the Python MCTS server.
 * Returns null gracefully if the server is offline — zero downtime fallback.
 */
async function fetchMonteCarlo(
  presetId: string,
  category: string,
  severityPct: number,
): Promise<MonteCarloResult | null> {
  try {
    const res = await fetch("/api/monte-carlo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presetId, category, severityPct }),
    });
    const data = await res.json();
    if (data.ok && data.data) return data.data as MonteCarloResult;
    return null; // server returned fallback: true
  } catch {
    return null; // server offline
  }
}

async function callEngine(
  presetId: string,
  levers: DecisionLever[],
  country: CountryProfile,
  mcSeverityPct?: number,
): Promise<PropagationResult> {
  const res = await fetch("/api/scenario-simulator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      presetId,
      levers,
      countryId: country.id,
      ...(mcSeverityPct !== undefined ? { mcSeverityPct } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Simulation failed");
  return data as PropagationResult;
}

export function useSimulation(): UseSimulationReturn {
  const [baseline, setBaseline] = useState<SimulationRun | null>(null);
  const [withLevers, setWithLevers] = useState<SimulationRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { activeCountry } = useCountry();

  const runBaseline = useCallback(async (presetId: string) => {
    setLoading(true);
    setError(null);
    setWithLevers(null);
    try {
      // Look up the preset to know its category + static severity
      const preset =
        activeCountry.disruptionPresets?.find((p) => p.id === presetId);
      const category = preset?.category ?? "multi_sector";
      const staticSeverity = preset?.severityPct ?? 50;

      // Step 1: Get dynamic Monte Carlo severity from Python server
      const mc = await fetchMonteCarlo(presetId, category, staticSeverity);

      // Step 2: Run deterministic engine with MC-derived severity (or static fallback)
      const result = await callEngine(presetId, [], activeCountry, mc?.severity_pct);

      setBaseline({ result, levers: [], label: "Baseline", monteCarloData: mc });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [activeCountry]);

  const runWithLevers = useCallback(
    async (presetId: string, levers: DecisionLever[]) => {
      setLoading(true);
      setError(null);
      try {
        const preset =
          activeCountry.disruptionPresets?.find((p) => p.id === presetId);
        const category = preset?.category ?? "multi_sector";
        const staticSeverity = preset?.severityPct ?? 50;

        // Run MC again (levers affect the physical network, not the MC params — but we
        // keep the MC-derived base severity consistent between runs)
        const mc = await fetchMonteCarlo(presetId, category, staticSeverity);
        const result = await callEngine(presetId, levers, activeCountry, mc?.severity_pct);

        setWithLevers({ result, levers, label: "With levers", monteCarloData: mc });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [activeCountry],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setBaseline(null);
    setWithLevers(null);
    setError(null);
  }, []);

  return { baseline, withLevers, loading, error, runBaseline, runWithLevers, reset };
}
