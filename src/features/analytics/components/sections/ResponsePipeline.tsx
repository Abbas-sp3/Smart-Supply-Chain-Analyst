"use client";

import { GitBranch, CheckCircle2, Loader2, Clock } from "lucide-react";

type PipelineStage = {
  id: string;
  label: string;
  description: string;
  status: "complete" | "active" | "waiting";
  module: string;
};

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "signal",
    label: "Signal Detection",
    description: "AIS anomalies, news volume spikes, geopolitical alerts",
    status: "complete",
    module: "Command Center + AIS Monitor",
  },
  {
    id: "geo_intel",
    label: "Geopolitical Intelligence",
    description: "RAG-enhanced knowledge graph enrichment + LLM narration",
    status: "complete",
    module: "Geopolitical Risk Module",
  },
  {
    id: "scenario",
    label: "Scenario Simulation",
    description: "User selects disruption preset from the event library",
    status: "complete",
    module: "Scenario Simulator",
  },
  {
    id: "propagation",
    label: "Impact Propagation",
    description: "BFS propagation across India Trade Knowledge Graph",
    status: "complete",
    module: "Propagation Engine",
  },
  {
    id: "procurement",
    label: "Procurement Optimization",
    description: "Alternative crude ranking by cost, transit, and compatibility",
    status: "complete",
    module: "Energy Procurement Module",
  },
  {
    id: "spr",
    label: "SPR Optimization",
    description: "Reserve drawdown against physical capacity limits and policy floors",
    status: "complete",
    module: "Strategic Reserve Module",
  },
  {
    id: "exec_rec",
    label: "Executive Recommendation",
    description: "Cross-module synthesis into strategic intelligence briefing",
    status: "complete",
    module: "Analytics — Strategic Intelligence Layer",
  },
];

const STATUS_STYLES = {
  complete: {
    dot: "bg-emerald-400",
    ring: "border-emerald-500/30",
    text: "text-emerald-400",
    label: "COMPLETED",
    icon: CheckCircle2,
  },
  active: {
    dot: "bg-sky-400 animate-pulse",
    ring: "border-sky-500/40 bg-sky-500/[0.04]",
    text: "text-sky-400",
    label: "RUNNING",
    icon: Loader2,
  },
  waiting: {
    dot: "bg-zinc-500",
    ring: "border-zinc-700",
    text: "text-zinc-500",
    label: "WAITING",
    icon: Clock,
  },
};

export function ResponsePipeline() {
  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      <div className="mb-6 flex items-center gap-2">
        <GitBranch className="size-4 text-sky-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
          Platform Response Pipeline
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50">
          End-to-end decision workflow
        </span>
      </div>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-white/10" />

        <div className="space-y-4">
          {PIPELINE_STAGES.map((stage, i) => {
            const config = STATUS_STYLES[stage.status];
            const Icon = config.icon;

            return (
              <div
                key={stage.id}
                className={`relative flex items-start gap-4 rounded-xl border p-4 transition-all ${config.ring} ${stage.status === "active" ? "shadow-sm" : ""}`}
              >
                {/* Step dot */}
                <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-white/10">
                  <Icon
                    className={`size-4 ${config.text} ${stage.status === "active" ? "animate-spin" : ""}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {i + 1}. {stage.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 border ${config.ring} ${config.text}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/70">{stage.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/40 font-medium">
                    {stage.module}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
