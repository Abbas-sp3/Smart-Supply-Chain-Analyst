/**
 * GET /api/procurement
 *
 * Returns a structured procurement intelligence briefing.
 * Cached server-side for 30 minutes.
 */

import { generateProcurementBriefing } from "@/features/procurement/services/procurementService";
import type { ProcurementApiResponse } from "@/features/procurement/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(): Promise<Response> {
  try {
    const briefing = await generateProcurementBriefing();
    return Response.json(briefing, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Procurement generation failed";
    console.error("[/api/procurement] Error:", message);
    const body: ProcurementApiResponse = { error: message };
    return Response.json(body, { status: 500 });
  }
}
