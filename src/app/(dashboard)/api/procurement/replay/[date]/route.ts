import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  
  const searchParams = _request.nextUrl.searchParams;
  const countryName = searchParams.get("countryName") || "India";

  // Validate ISO date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format — expected YYYY-MM-DD" }, { status: 400 });
  }

  const filePath = path.join(
    process.cwd(),
    "src",
    "data",
    "replay-snapshots",
    `${date}.json`,
  );

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: `No snapshot found for ${date}` }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    let snapshot = JSON.parse(raw);

    // Deterministic string replacement so the historical replay reflects the selected country
    if (countryName.toLowerCase() !== "india") {
      const replaceAll = (text: string) => {
        if (!text) return text;
        return text
          .replace(/\bIndia's\b/g, `${countryName}'s`)
          .replace(/\bIndian\b/g, `${countryName}'s`)
          .replace(/\bIndia\b/g, countryName)
          .replace(/\bMEA\b/g, "Foreign Ministry")
          .replace(/\bCoal India\b/g, "State Energy Board")
          .replace(/\bPPAC\b/g, "National Energy Agency");
      };

      if (snapshot.system_recommendation?.executive_summary) {
        snapshot.system_recommendation.executive_summary = replaceAll(snapshot.system_recommendation.executive_summary);
      }
      if (snapshot.actual_outcome?.documented_response) {
        snapshot.actual_outcome.documented_response = replaceAll(snapshot.actual_outcome.documented_response);
      }
    }

    return NextResponse.json(snapshot, { status: 200 });
  } catch {
    return NextResponse.json({ error: `Failed to read snapshot for ${date}` }, { status: 500 });
  }
}
