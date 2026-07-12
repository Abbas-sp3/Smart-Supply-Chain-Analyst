/**
 * POST /api/scenario-simulator
 *
 * Request body:
 *   { presetId: string; levers?: DecisionLever[] }
 *
 * Response:
 *   PropagationResult (JSON)
 *
 * The LLM layer never touches numbers. This route runs the deterministic
 * propagation engine server-side and returns the full PropagationResult.
 */

import { NextRequest, NextResponse } from "next/server";

import { getPresetById } from "@/features/scenario-simulator/constants/disruption-presets";
import { runPropagation } from "@/features/scenario-simulator/services/propagationEngine";
import type { DecisionLever } from "@/features/scenario-simulator/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { presetId, levers = [] } = body as {
      presetId: string;
      levers?: DecisionLever[];
    };

    if (!presetId || typeof presetId !== "string") {
      return NextResponse.json(
        { error: "presetId is required" },
        { status: 400 },
      );
    }

    const preset = getPresetById(presetId);
    if (!preset) {
      return NextResponse.json(
        { error: `Unknown presetId: "${presetId}"` },
        { status: 404 },
      );
    }

    // Validate levers array (basic type guard)
    if (!Array.isArray(levers)) {
      return NextResponse.json(
        { error: "levers must be an array" },
        { status: 400 },
      );
    }

    const result = runPropagation(preset, levers);
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
