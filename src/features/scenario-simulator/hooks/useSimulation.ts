"use client";

import { useState, useCallback, useRef } from "react";
import type {
  PropagationResult,
  DecisionLever,
} from "@/features/scenario-simulator/types";

export type SimulationRun = {
  result: PropagationResult;
  levers: DecisionLever[];
  label: string; // "Baseline" | "With levers"
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

async function callEngine(
  presetId: string,
  levers: DecisionLever[],
): Promise<PropagationResult> {
  const res = await fetch("/api/scenario-simulator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ presetId, levers }),
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

  const runBaseline = useCallback(async (presetId: string) => {
    setLoading(true);
    setError(null);
    setWithLevers(null);
    try {
      const result = await callEngine(presetId, []);
      setBaseline({ result, levers: [], label: "Baseline" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const runWithLevers = useCallback(
    async (presetId: string, levers: DecisionLever[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await callEngine(presetId, levers);
        setWithLevers({ result, levers, label: "With levers" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setBaseline(null);
    setWithLevers(null);
    setError(null);
  }, []);

  return { baseline, withLevers, loading, error, runBaseline, runWithLevers, reset };
}
