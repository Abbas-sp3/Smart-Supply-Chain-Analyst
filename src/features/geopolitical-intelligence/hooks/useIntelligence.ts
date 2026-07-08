/**
 * useIntelligence — Client-side data hook
 *
 * Fetches the intelligence report from /api/intelligence.
 * - Triggers on mount
 * - Exposes loading, error, and refetch states
 * - Auto-refreshes every 30 minutes to match server-side cache TTL
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { IntelligenceReport } from "../types";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

type IntelligenceState = {
  data: IntelligenceReport | null;
  isLoading: boolean;
  error: string | null;
  generatedAt: string | null;
  refetch: () => void;
};

export function useIntelligence(): IntelligenceState {
  const [data, setData] = useState<IntelligenceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  // A counter that increments to trigger a fetch — lets the effect stay pure
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const isMounted = useRef(true);

  // Increment trigger to request a fresh fetch
  const refetch = useCallback(() => {
    setFetchTrigger((n) => n + 1);
  }, []);

  // Auto-refresh interval — only manages the timer, no setState inside body
  useEffect(() => {
    isMounted.current = true;
    const interval = setInterval(refetch, REFRESH_INTERVAL_MS);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [refetch]);

  // Fetch runs as a side-effect of fetchTrigger changing
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isMounted.current) return;
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/intelligence", { cache: "no-store" });
        const json = (await res.json()) as
          | { report: IntelligenceReport; generatedAt: string }
          | { error: string };

        if (cancelled) return;

        if ("error" in json) {
          setError(json.error);
          setData(null);
        } else {
          setData(json.report);
          setGeneratedAt(json.generatedAt);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch intelligence report",
        );
        setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [fetchTrigger]);

  return { data, isLoading, error, generatedAt, refetch };
}
