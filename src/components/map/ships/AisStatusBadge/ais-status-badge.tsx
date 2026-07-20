"use client";

import { useEffect, useState } from "react";
import { useAisStatus } from "@/lib/aisstream/ais-status-context";

/** Returns a human-readable "X min ago" or "X sec ago" string */
function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

export function AisStatusBadge() {
  const { status, lastUpdated } = useAisStatus();
  const [, forceRender] = useState(0);

  // Re-render every 30s so "X ago" stays fresh
  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Don't show anything when fully connected and data is flowing
  if (status === "connected") return null;

  if (status === "reconnecting") {
    return (
      <div
        aria-live="polite"
        className="pointer-events-none flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-400/30 backdrop-blur-md"
      >
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>
        Live feed reconnecting…
        {lastUpdated && (
          <span className="text-amber-400/70">· last seen {timeAgo(lastUpdated)}</span>
        )}
      </div>
    );
  }

  // unavailable
  return (
    <div
      aria-live="polite"
      className="pointer-events-none flex items-center gap-1.5 rounded-md bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-600/50 backdrop-blur-md"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-500" />
      {lastUpdated
        ? `Live vessel data unavailable · last known ${timeAgo(lastUpdated)}`
        : "Live vessel data unavailable"}
    </div>
  );
}
