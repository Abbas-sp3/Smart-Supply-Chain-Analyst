"use client";

import { motion } from "framer-motion";
import { Clock, Ship, TrendingUp, Play, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { DISRUPTION_PRESETS } from "@/features/scenario-simulator/constants/disruption-presets";
import { CATEGORY_META, SEVERITY_COLOR } from "@/features/scenario-simulator/constants/ui-constants";

type DisruptionPresetSelectorProps = {
  selectedPresetId: string;
  onPresetChange: (id: string) => void;
  onRunBaseline: () => void;
  loading: boolean;
  hasBaseline: boolean;
  error: string | null;
  title?: string;
  description?: string;
};

export function DisruptionPresetSelector({
  selectedPresetId,
  onPresetChange,
  onRunBaseline,
  loading,
  hasBaseline,
  error,
  title = "Select Disruption Scenario",
  description = "No LLM in the computation path — engine runs deterministically",
}: DisruptionPresetSelectorProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground/50">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {DISRUPTION_PRESETS.map((preset) => {
          const meta =
            CATEGORY_META[preset.category] ?? CATEGORY_META.multi_sector;
          const isSelected = preset.id === selectedPresetId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetChange(preset.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 border-l-4",
                meta.border,
                isSelected
                  ? "border-y-white/20 border-r-white/20 bg-[#10151d]"
                  : "border-y-white/8 border-r-white/8 bg-[#0e1319] hover:bg-[#10151d]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span
                    className={cn(
                      "mb-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      meta.badge,
                    )}
                  >
                    <meta.icon className="size-3" aria-hidden />
                    {meta.label}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold leading-tight text-foreground">
                    {preset.label}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={cn(
                      "text-lg font-normal tabular-nums",
                      SEVERITY_COLOR(preset.severityPct),
                    )}
                  >
                    {preset.severityPct}%
                  </div>
                  <div className="text-xs text-muted-foreground">severity</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  ~{preset.expectedDurationDays}d
                </span>
                <span className="flex items-center gap-1">
                  <Ship className="size-3" />
                  {preset.affectedNodeIds.length} nodes
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  +{preset.spotFreightPenaltyPct}% freight
                </span>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Run baseline button */}
      <motion.button
        type="button"
        onClick={onRunBaseline}
        disabled={loading}
        whileHover={!loading ? { scale: 1.005 } : {}}
        whileTap={!loading ? { scale: 0.995 } : {}}
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#0e1319] px-6 py-4 text-sm font-semibold uppercase tracking-wider text-foreground transition-all",
          "hover:bg-[#10151d] disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {loading && !hasBaseline ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="size-4 rounded-full border-2 border-white/20 border-t-white/70"
            />
            Running propagation engine…
          </>
        ) : (
          <>
            <Play className="size-4" aria-hidden />
            {hasBaseline ? "Re-run baseline" : "Run baseline simulation"}
          </>
        )}
      </motion.button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
