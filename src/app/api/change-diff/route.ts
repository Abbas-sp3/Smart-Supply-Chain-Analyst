import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const SNAPSHOT_DIR = join(process.cwd(), ".data", "snapshots");
const SNAPSHOT_FILE = join(SNAPSHOT_DIR, "latest.json");
const HISTORY_FILE = join(SNAPSHOT_DIR, "history.json");

type DiffEntry = {
  field: string;
  previous: string;
  current: string;
  changeType: "improved" | "degraded" | "new" | "removed";
};

type Snapshot = {
  id: string;
  timestamp: string;
  source: string;
  diffs: DiffEntry[];
};

type StoredSnapshot = {
  id: string;
  timestamp: string;
  source: string;
  data: Record<string, unknown>;
};

function ensureDir() {
  if (!existsSync(SNAPSHOT_DIR)) {
    const { mkdirSync } = require("fs");
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function readHistory(): StoredSnapshot[] {
  try {
    if (existsSync(HISTORY_FILE)) {
      return JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
    }
  } catch { /* empty */ }
  return [];
}

function writeHistory(history: StoredSnapshot[]) {
  ensureDir();
  writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-50), null, 0));
}

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      out[key] = `[${v.length} items]`;
    } else if (typeof v === "string" && v.length > 200) {
      out[key] = v.slice(0, 200) + "...";
    } else {
      out[key] = String(v ?? "");
    }
  }
  return out;
}

function computeDiffs(prev: Record<string, string>, curr: Record<string, string>): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);

  for (const key of allKeys) {
    const p = prev[key];
    const c = curr[key];
    if (p === c) continue;
    if (p === undefined) {
      diffs.push({ field: key, previous: "(none)", current: c, changeType: "new" });
    } else if (c === undefined) {
      diffs.push({ field: key, previous: p, current: "(removed)", changeType: "removed" });
    } else {
      const isImproved = /improved|better|lower risk|more diversified|recommended/i.test(c) && /degraded|worse|higher risk|less diversified/i.test(p);
      const isDegraded = /degraded|worse|higher risk|less diversified|caution/i.test(c) && /improved|better|lower risk|more diversified/i.test(p);
      diffs.push({
        field: key,
        previous: p,
        current: c,
        changeType: isImproved ? "improved" : isDegraded ? "degraded" : "new",
      });
    }
  }

  return diffs.slice(0, 20);
}

export async function GET() {
  try {
    const history = readHistory();
    const snapshots: Snapshot[] = history.map((h, i) => {
      const prev = i > 0 ? flatten(history[i - 1].data) : {};
      const curr = flatten(h.data);
      const diffs = i > 0 ? computeDiffs(prev, curr) : Object.keys(curr).map((k) => ({
        field: k, previous: "(initial)", current: curr[k], changeType: "new" as const,
      }));
      return { id: h.id, timestamp: h.timestamp, source: h.source, diffs };
    });

    return NextResponse.json({ snapshots: snapshots.slice(-10).reverse() }, { status: 200 });
  } catch (err) {
    console.error("change-diff error:", err);
    return NextResponse.json({ snapshots: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, data } = body as { source: string; data: Record<string, unknown> };

    ensureDir();
    const history = readHistory();
    const newEntry: StoredSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: source ?? "unknown",
      data: data ?? {},
    };

    history.push(newEntry);
    writeHistory(history);
    writeFileSync(SNAPSHOT_FILE, JSON.stringify(newEntry));

    return NextResponse.json({ ok: true, id: newEntry.id }, { status: 200 });
  } catch (err) {
    console.error("change-diff POST error:", err);
    return NextResponse.json({ error: "Failed to store snapshot" }, { status: 500 });
  }
}
