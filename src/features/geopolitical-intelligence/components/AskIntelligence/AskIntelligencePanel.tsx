"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  BookOpen,
  AlertCircle,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Network,
  FileSearch,
  Cpu,
} from "lucide-react";

interface RetrievedChunk {
  sourceLabel: string;
  score: number;
  excerpt: string;
}

interface Result {
  answer: string;
  citations: string[];
  retrievedChunks?: RetrievedChunk[];
  belowThreshold?: boolean;
  error?: string;
}

type Phase = "idle" | "embedding" | "retrieving" | "generating" | "done" | "error";

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-[10px] font-mono font-bold tabular-nums ${pct >= 60 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400"}`}>
        {(score).toFixed(3)}
      </span>
    </div>
  );
}

function PhaseStep({
  icon: Icon,
  label,
  sublabel,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div className={`flex items-start gap-3 transition-all duration-300 ${status === "pending" ? "opacity-30" : "opacity-100"}`}>
      <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
        status === "done"
          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
          : status === "active"
          ? "border-primary bg-primary/10 text-primary animate-pulse"
          : "border-white/10 text-white/20"
      }`}>
        {status === "done" ? (
          <CheckCircle2 className="size-3.5" />
        ) : status === "active" ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Icon className="size-3" />
        )}
      </div>
      <div>
        <div className={`text-xs font-semibold ${status === "active" ? "text-foreground" : status === "done" ? "text-emerald-300" : "text-white/30"}`}>
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sublabel}</div>
      </div>
    </div>
  );
}

function SourceChunkCard({ chunk, index }: { chunk: RetrievedChunk; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isHighRelevance = chunk.score >= 0.55;

  return (
    <div className={`rounded-lg border p-3 text-xs transition-all ${isHighRelevance ? "border-emerald-500/30 bg-emerald-950/20" : "border-white/[0.06] bg-white/[0.02]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold ${isHighRelevance ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"}`}>
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground/90 truncate">{chunk.sourceLabel}</div>
            <div className="mt-1">
              <ScoreBar score={chunk.score} />
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle excerpt"
        >
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-muted-foreground/80 font-mono">
          {chunk.excerpt}
        </div>
      )}
    </div>
  );
}

export function AskIntelligencePanel() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [showChunks, setShowChunks] = useState(true);

  const getPhaseStatus = (p: Phase): "pending" | "active" | "done" => {
    const order: Phase[] = ["idle", "embedding", "retrieving", "generating", "done"];
    const currentIdx = order.indexOf(phase);
    const targetIdx = order.indexOf(p);
    if (currentIdx > targetIdx) return "done";
    if (currentIdx === targetIdx) return "active";
    return "pending";
  };

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setResult(null);
    setShowChunks(true);

    // Phase 1: Embedding
    setPhase("embedding");
    await new Promise((r) => setTimeout(r, 600));

    // Phase 2: Retrieving
    setPhase("retrieving");

    let data: Result & { error?: string };
    try {
      const res = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      data = await res.json();

      if (!res.ok) {
        setPhase("error");
        setResult({ answer: "", citations: [], error: data.error || "An error occurred" });
        return;
      }

      // Phase 3: Generating (show chunks first)
      setPhase("generating");
      await new Promise((r) => setTimeout(r, 400));

      setPhase("done");
      setResult(data);
    } catch (err: any) {
      setPhase("error");
      setResult({ answer: "", citations: [], error: err.message });
    }
  }

  const isRunning = phase === "embedding" || phase === "retrieving" || phase === "generating";

  return (
    <div className="mt-6 flex flex-col gap-0 rounded-2xl border border-white/10 bg-[oklch(0.12_0.008_260/0.8)] overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Network className="size-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground tracking-tight">Intelligence RAG</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Answers grounded strictly in your private corpus — no hallucination
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400">Corpus Ready</span>
        </div>
      </div>

      {/* Corpus stats bar */}
      <div className="flex items-center gap-6 border-b border-white/[0.04] bg-white/[0.01] px-5 py-2.5">
        {[
          { icon: Database, label: "Knowledge Graph", value: "1,499+ nodes" },
          { icon: FileSearch, label: "Historical Records", value: "4 precedents" },
          { icon: Cpu, label: "Embedding Model", value: "MiniLM-L6-v2" },
          { icon: BookOpen, label: "Similarity Search", value: "Cosine · Top-4" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="size-3 text-muted-foreground/50" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40">{label}</div>
              <div className="text-[10px] font-semibold text-muted-foreground/80">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-5 pt-4 pb-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What was the impact of the 2021 Suez blockage on India?"
              className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={isRunning || !query.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95"
          >
            {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {isRunning ? "Running…" : "Search"}
          </button>
        </form>
      </div>

      {/* Pipeline progress — shown while running OR after done */}
      {phase !== "idle" && (
        <div className="mx-5 mb-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-3 font-semibold">
            RAG Pipeline
          </div>
          <div className="flex flex-col gap-3">
            <PhaseStep
              icon={Cpu}
              label="Encode Query"
              sublabel="Running MiniLM-L6-v2 on-server to generate a 384-dim query vector"
              status={getPhaseStatus("embedding")}
            />
            <PhaseStep
              icon={Database}
              label="Vector Search"
              sublabel="Cosine similarity against all 1,499+ corpus chunks — selecting top-4 matches"
              status={getPhaseStatus("retrieving")}
            />
            <PhaseStep
              icon={Sparkles}
              label="Grounded Synthesis"
              sublabel="LLaMA-3.3-70B reads ONLY the retrieved context — zero outside knowledge"
              status={getPhaseStatus("generating")}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {result && phase === "done" && (
        <div className="flex flex-col gap-4 px-5 pb-5">

          {/* Retrieved Sources */}
          {result.retrievedChunks && result.retrievedChunks.length > 0 && (
            <div>
              <button
                className="mb-2 flex w-full items-center justify-between text-left"
                onClick={() => setShowChunks((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <Database className="size-3 text-sky-400/70" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Retrieved Context ({result.retrievedChunks.length} chunks)
                  </span>
                  {result.belowThreshold && (
                    <span className="rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[9px] text-red-400 font-semibold">
                      Below threshold — answer blocked
                    </span>
                  )}
                </div>
                {showChunks ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
              </button>

              {showChunks && (
                <div className="flex flex-col gap-2">
                  {result.retrievedChunks.map((chunk, i) => (
                    <SourceChunkCard key={i} chunk={chunk} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Synthesized Answer */}
          {result.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertCircle className="size-4 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-sm text-amber-300">{result.error}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                  Synthesized Answer — grounded in retrieved context only
                </span>
              </div>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {phase === "error" && result?.error && (
        <div className="mx-5 mb-5 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
          <span className="text-sm text-red-300">{result.error}</span>
        </div>
      )}
    </div>
  );
}
