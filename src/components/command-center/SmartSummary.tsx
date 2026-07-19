"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Clock } from "lucide-react";
import type { NesiComponents } from "@/lib/nesi";

interface SmartSummaryProps {
  components: NesiComponents;
  activeAlerts: any[];
}

export function SmartSummary({ components, activeAlerts }: SmartSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/command-center/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nesi: components.nesi,
            grf: components.grf,
            srf: components.srf,
            scrf: components.scrf,
            activeAlerts,
            scenarioRun: null // Not persistently available, explicit via instructions
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch summary");
        }
        
        const data = await response.json();
        if (isMounted) {
          setSummary(data.summary);
          setGeneratedAt(data.generatedAt);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to generate AI summary.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchSummary();
    
    return () => {
      isMounted = false;
    };
  }, [components, activeAlerts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="solid-card rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col h-full relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-5" />
          <h2 className="text-lg font-bold tracking-tight">Executive Synthesis</h2>
        </div>
        
        {generatedAt && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-muted-foreground">
            <Clock className="size-3" />
            <span>Last computed: {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-[90%]" />
            <div className="h-4 bg-white/10 rounded w-[95%]" />
            <div className="h-4 bg-white/10 rounded w-[80%]" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-400/20">
            <AlertCircle className="size-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <p className="text-sm sm:text-base leading-relaxed text-foreground/90 font-medium">
            {summary}
          </p>
        )}
      </div>
    </motion.div>
  );
}
