"use client";

import { useState } from "react";
import { Search, Loader2, BookOpen, AlertCircle } from "lucide-react";

export function AskIntelligencePanel() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; citations: string[]; error?: string } | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/intelligence/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query })
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ answer: "", citations: [], error: data.error || "An error occurred" });
      } else {
        setResult({ answer: data.answer, citations: data.citations });
      }
    } catch (err: any) {
      setResult({ answer: "", citations: [], error: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="solid-card mt-6 flex flex-col gap-4 rounded-xl border border-white/10 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Search className="size-4 text-primary" />
        Ask Intelligence (RAG)
      </div>
      <p className="text-xs text-muted-foreground/70">
        Ask a question about historical precedents, scenarios, or supply chain nodes. 
        Answers are strictly generated from the local intelligence corpus.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. What happened during the 2021 Suez blockage?"
          className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
        />
        <button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="flex items-center justify-center rounded-md bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Ask"}
        </button>
      </form>

      {result && (
        <div className="mt-2 flex flex-col gap-3 rounded-lg bg-black/40 p-4 border border-white/5">
          {result.error ? (
             <div className="flex items-center gap-2 text-sm text-amber-400">
               <AlertCircle className="size-4" />
               {result.error}
             </div>
          ) : (
            <>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </div>
              {result.citations && result.citations.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 border-t border-white/5 pt-3">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Sources Cited:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.citations.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-[11px] text-muted-foreground">
                        <BookOpen className="size-3 text-sky-400/70" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
