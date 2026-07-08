"use client";

import { motion } from "framer-motion";

import { FloatingPanel } from "@/components/floating-panel";
import { WORKSPACE_PANELS } from "@/lib/constants/layout";
import { staggerContainer } from "@/lib/motion";

export function WorkspaceContent() {
  return (
    <motion.div
      className="pointer-events-none grid h-full min-h-full gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-2 lg:gap-6 lg:p-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {WORKSPACE_PANELS.map((panel) => (
        <div key={panel.id} className="pointer-events-auto">
          <FloatingPanel title={panel.title}>{panel.placeholder}</FloatingPanel>
        </div>
      ))}
    </motion.div>
  );
}
