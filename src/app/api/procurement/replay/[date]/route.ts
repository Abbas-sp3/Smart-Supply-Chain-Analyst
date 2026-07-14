import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;

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
    const snapshot = JSON.parse(raw);
    return NextResponse.json(snapshot, { status: 200 });
  } catch {
    return NextResponse.json({ error: `Failed to read snapshot for ${date}` }, { status: 500 });
  }
}
