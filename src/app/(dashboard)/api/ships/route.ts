import { aisStreamManager } from "@/lib/aisstream/manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = aisStreamManager.getShips();

  return Response.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
