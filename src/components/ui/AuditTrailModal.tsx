"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, AlertCircle, Info, ChevronRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type AuditTrailProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reasoning: string[];
  metrics?: {
    supplyGapMtpa?: number;
    breachesFloor?: boolean;
    estimatedReplenishmentDays?: number;
    targetDailyRateMtpa?: number;
  };
};

export function AuditTrailModal({ isOpen, onClose, title = "Engine Reasoning & Audit Trail", reasoning, metrics }: AuditTrailProps) {

  const [mounted, setMounted] = useState(false);

  // Prevent scrolling when modal is open
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Search className="size-5 text-sky-400" />
                  <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                
                {/* Metrics Summary */}
                {metrics && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {metrics.supplyGapMtpa !== undefined && (
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Supply Gap</div>
                        <div className="mt-1 text-lg font-bold text-white">{metrics.supplyGapMtpa.toFixed(2)} <span className="text-xs font-normal text-zinc-500">Mtpa</span></div>
                      </div>
                    )}
                    {metrics.targetDailyRateMtpa !== undefined && (
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Target Rate</div>
                        <div className="mt-1 text-lg font-bold text-white">{(metrics.targetDailyRateMtpa * 1000).toFixed(0)} <span className="text-xs font-normal text-zinc-500">kMT/d</span></div>
                      </div>
                    )}
                    {metrics.estimatedReplenishmentDays !== undefined && (
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Replenish</div>
                        <div className="mt-1 text-lg font-bold text-white">{metrics.estimatedReplenishmentDays} <span className="text-xs font-normal text-zinc-500">Days</span></div>
                      </div>
                    )}
                    {metrics.breachesFloor !== undefined && (
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Floor Status</div>
                        <div className={`mt-1 text-sm font-bold ${metrics.breachesFloor ? 'text-red-400' : 'text-emerald-400'}`}>
                          {metrics.breachesFloor ? 'BREACHED' : 'SAFE'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reasoning Steps */}
                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Decision Logic</h3>
                  <div className="space-y-3">
                    {reasoning.map((step, idx) => {
                      const isAssumption = step.toLowerCase().includes("illustrative") || step.toLowerCase().includes("assume");
                      const isWarning = step.toLowerCase().includes("warning") || step.toLowerCase().includes("breach") || step.toLowerCase().includes("exceed");
                      const isAction = step.toLowerCase().includes("prioritize") || step.toLowerCase().includes("target relief");
                      
                      return (
                        <div key={idx} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm">
                          <div className="mt-0.5 shrink-0">
                            {isAssumption ? (
                              <Info className="size-4 text-sky-400" />
                            ) : isWarning ? (
                              <AlertCircle className="size-4 text-orange-400" />
                            ) : isAction ? (
                              <Zap className="size-4 text-emerald-400" />
                            ) : (
                              <ChevronRight className="size-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="text-zinc-300">
                            {step}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Disclosure */}
                <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-500/80 flex items-start gap-2">
                   <Info className="size-4 shrink-0 mt-0.5" />
                   <span><strong className="text-amber-500">Illustrative assumption:</strong> Any parameters marked as "illustrative" (such as specific trigger thresholds or replenishment rates) are functional stand-ins for proprietary or dynamic policy metrics that the government does not publish in real-time.</span>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
