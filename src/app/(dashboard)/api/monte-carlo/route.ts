/**
 * POST /api/monte-carlo
 *
 * Proxy to the Python Monte Carlo MCTS server running at localhost:8787.
 * Returns dynamic risk percentages computed via Global MCTS engine.
 *
 * If the Python server is unavailable, returns a fallback response so the
 * Next.js app keeps running with static preset severity — zero downtime.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MONTE_CARLO_URL =
  process.env.MONTE_CARLO_SERVER_URL ?? "http://localhost:8787";

export type MonteCarloResult = {
  preset_id: string;
  severity_pct: number;
  severity_range: { min: number; max: number };
  escalation_pct: number;
  economic_stress_pct: number;
  negotiation_score: number;
  best_action: string;
  phase_distribution: Record<string, number>;
  iterations_run: number;
  root_visits: number;
  computation_ms: number;
  method: string;
  initial_phase: string;
  terminal_phase: string;
};

export type MonteCarloResponse =
  | { ok: true; data: MonteCarloResult }
  | { ok: false; error: string; fallback: true };

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { presetId, category = "multi_sector", severityPct = 50 } = body as {
      presetId: string;
      category?: string;
      severityPct?: number;
    };

    if (!presetId) {
      return NextResponse.json({ error: "presetId required" }, { status: 400 });
    }

    // Call Python Monte Carlo server
    const mcRes = await fetch(`${MONTE_CARLO_URL}/monte-carlo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preset_id: presetId,
        category,
        severity_pct: severityPct,
        iterations: 600,
      }),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (!mcRes.ok) {
      const errText = await mcRes.text();
      console.warn("[monte-carlo proxy] Python server error:", errText);
      return NextResponse.json<MonteCarloResponse>(
        { ok: false, error: `Python server returned ${mcRes.status}`, fallback: true },
        { status: 200 },
      );
    }

    const data = (await mcRes.json()) as MonteCarloResult;
    return NextResponse.json<MonteCarloResponse>({ ok: true, data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[monte-carlo proxy] Server unreachable:", msg);
    return NextResponse.json<MonteCarloResponse>(
      { ok: false, error: "Monte Carlo server offline — using static severity", fallback: true },
      { status: 200 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
