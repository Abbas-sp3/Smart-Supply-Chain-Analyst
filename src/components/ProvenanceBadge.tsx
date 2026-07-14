type ProvenanceKind = "live" | "historical" | "ai-estimate" | "static";

const BADGE_STYLES: Record<ProvenanceKind, string> = {
  live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  historical: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "ai-estimate": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  static: "bg-white/5 text-muted-foreground border-white/10",
};

const BADGE_LABELS: Record<ProvenanceKind, string> = {
  live: "Live",
  historical: "Historical (EIA)",
  "ai-estimate": "AI directional estimate",
  static: "Reference data",
};

export function ProvenanceBadge({ kind }: { kind: ProvenanceKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${BADGE_STYLES[kind]}`}
    >
      {BADGE_LABELS[kind]}
    </span>
  );
}
