"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { APP_NAME } from "@/lib/constants/app";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { overlayVariants, sidebarVariants } from "@/lib/motion";

type SidebarNavProps = {
  showLabels: boolean;
};

function SidebarNav({ showLabels }: SidebarNavProps) {
  const pathname = usePathname();
  const { closeMobile } = useSidebar();

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.enabled && pathname === item.href;

          const itemClassName = cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
            !showLabels && "justify-center",
            isActive
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
          );

          const content = (
            <>
              <Icon aria-hidden className="size-4 shrink-0" />
              {showLabels && <span className="truncate">{item.label}</span>}
            </>
          );

          return (
            <li key={item.id}>
              {item.enabled ? (
                <Link
                  href={item.href}
                  onClick={closeMobile}
                  title={!showLabels ? item.label : undefined}
                  className={itemClassName}
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-disabled
                  title={!showLabels ? item.label : undefined}
                  className={cn(
                    itemClassName,
                    "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
                  )}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type SidebarInnerProps = {
  showLabels: boolean;
};

function SidebarInner({ showLabels }: SidebarInnerProps) {
  return (
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-white/10",
          showLabels ? "px-4" : "justify-center px-3",
        )}
      >
        <PanelLeft aria-hidden className="size-4 shrink-0 text-primary" />
        {showLabels && (
          <span className="ml-2.5 text-[10px] font-semibold uppercase tracking-widest leading-normal text-muted-foreground">
            Energy Supply Chain
          </span>
        )}
      </div>
      <SidebarNav showLabels={showLabels} />
    </>
  );
}

export function AppSidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        animate={showLabels ? "expanded" : "collapsed"}
        initial={false}
        className={cn(
          "glass-surface z-50 flex shrink-0 flex-col overflow-hidden border-r border-white/10",
          "fixed inset-y-0 left-0 md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "transition-transform duration-300 ease-out md:transition-none",
        )}
      >
        <SidebarInner showLabels={showLabels} />
      </motion.aside>
    </>
  );
}
