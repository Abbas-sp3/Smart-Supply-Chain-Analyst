"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { fadeInUp } from "@/lib/motion";

type FloatingPanelProps = {
  title: string;
  children: ReactNode;
};

export function FloatingPanel({ title, children }: FloatingPanelProps) {
  return (
    <motion.article
      variants={fadeInUp}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-panel group flex min-h-[180px] flex-col p-4 sm:min-h-[220px] sm:p-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <span className="size-1.5 rounded-full bg-primary/60 opacity-0 transition-opacity group-hover:opacity-100" />
      </header>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-8">
        <p className="text-center text-sm text-muted-foreground">{children}</p>
      </div>
    </motion.article>
  );
}
