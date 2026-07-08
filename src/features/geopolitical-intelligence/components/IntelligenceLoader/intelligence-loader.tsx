"use client";

/**
 * IntelligenceLoader — Skeleton loading state
 * Mirrors the glass-panel aesthetic while content is loading.
 */
export function IntelligenceLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Executive Summary skeleton */}
      <div className="glass-panel p-5 space-y-3">
        <div className="h-3 w-40 rounded bg-white/10" />
        <div className="h-4 rounded bg-white/[0.07]" />
        <div className="h-4 rounded bg-white/[0.07]" />
        <div className="h-4 w-3/4 rounded bg-white/[0.07]" />
      </div>

      {/* Key Developments skeleton */}
      <div className="glass-panel p-5 space-y-3">
        <div className="h-3 w-44 rounded bg-white/10" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="h-3 w-2/3 rounded bg-white/10" />
            <div className="h-3 rounded bg-white/[0.06]" />
            <div className="h-3 w-4/5 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-5 space-y-3">
            <div className="h-3 w-36 rounded bg-white/10" />
            {[1, 2].map((j) => (
              <div key={j} className="h-3 rounded bg-white/[0.07]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
