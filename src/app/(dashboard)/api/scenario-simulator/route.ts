/**
 * POST /api/scenario-simulator
 *
 * Request body:
 *   { presetId: string; levers?: DecisionLever[]; countryId?: string }
 *
 * Response:
 *   PropagationResult (JSON)
 *
 * The LLM layer never touches numbers. This route runs the deterministic
 * propagation engine server-side and returns the full PropagationResult.
 *
 * ISOLATION GUARANTEE: The preset is always looked up from the country's
 * own disruptionPresets array first. This ensures Singapore presets never
 * accidentally run India's graph and vice versa.
 */

import { NextRequest, NextResponse } from "next/server";

import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { runPropagation } from "@/features/scenario-simulator/services/propagationEngine";
import type { DecisionLever } from "@/features/scenario-simulator/types";
import type { CountryProfile } from "@/data/countries/types";

export const runtime = "nodejs";

async function loadCountryProfile(countryId: string): Promise<CountryProfile | null> {
  if (countryId === "india") {
    const { indiaProfile } = await import("@/data/countries/india");
    return indiaProfile;
  }
  if (countryId === "singapore") {
    const { singaporeProfile } = await import("@/data/countries/singapore");
    return singaporeProfile;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { presetId, levers = [], countryId = "india", mcSeverityPct } = body as {
      presetId: string;
      levers?: DecisionLever[];
      countryId?: string;
      /** Optional Monte Carlo-derived severity (overrides preset.severityPct when set). */
      mcSeverityPct?: number;
    };

    if (!presetId || typeof presetId !== "string") {
      return NextResponse.json(
        { error: "presetId is required" },
        { status: 400 },
      );
    }

    // Validate levers array (basic type guard)
    if (!Array.isArray(levers)) {
      return NextResponse.json(
        { error: "levers must be an array" },
        { status: 400 },
      );
    }

    // Load the country profile
    const countryProfile = await loadCountryProfile(countryId);
    if (!countryProfile) {
      return NextResponse.json({ error: `Unknown countryId: "${countryId}"` }, { status: 404 });
    }

    // ISOLATION: look up preset from the country's own list first, 
    // fall back to the global list only for cross-country presets (e.g. analytics page)
    const basePreset =
      countryProfile.disruptionPresets.find((p) => p.id === presetId) ??
      DISRUPTION_PRESETS.find((p) => p.id === presetId);

    if (!basePreset) {
      return NextResponse.json(
        { error: `Unknown presetId: "${presetId}" for country "${countryId}"` },
        { status: 404 },
      );
    }

    // ── Apply Monte Carlo override ───────────────────────────────────────────
    // If the Python MCTS server provided a dynamic severity, inject it into the
    // preset. The severityRange min/max are also updated proportionally.
    const preset = (mcSeverityPct !== undefined && mcSeverityPct > 0)
      ? {
          ...basePreset,
          severityPct: Math.round(mcSeverityPct * 10) / 10,
          severityRange: {
            min: Math.round(Math.max(0, mcSeverityPct * 0.70) * 10) / 10,
            likely: Math.round(mcSeverityPct * 10) / 10,
            max: Math.round(Math.min(100, mcSeverityPct * 1.35) * 10) / 10,
            unit: "percent" as const,
          },
        }
      : basePreset;

    const result = runPropagation(preset, levers, countryProfile);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[scenario-simulator API]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST with { presetId, levers? }" },
    { status: 405 },
  );
}
