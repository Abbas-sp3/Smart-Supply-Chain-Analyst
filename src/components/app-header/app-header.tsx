"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, Globe2 } from "lucide-react";

import { usePathname } from "next/navigation";

import { useSidebar } from "@/hooks/use-sidebar";
import { useCountry } from "@/hooks/useCountry";
import { APP_NAME } from "@/lib/constants/app";
import { NAV_ITEMS } from "@/lib/constants/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, toggleMobile } = useSidebar();
  const { activeCountry, clearSelection } = useCountry();
  
  const currentNav = NAV_ITEMS.find((item) => item.href === pathname);
  const title = currentNav ? currentNav.label : APP_NAME;

  return (
    <header className="glass-surface z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobile}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:hidden"
          aria-label="Open navigation"
        >
          <Menu aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-4" />
          ) : (
            <PanelLeftClose aria-hidden className="size-4" />
          )}
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-medium">{title}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={clearSelection}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all"
          title="Change Country"
        >
          <span className="text-base leading-none">{activeCountry.flag || "🌍"}</span>
          <span className="hidden sm:inline-block">{activeCountry.name}</span>
        </button>
      </div>
    </header>
  );
}
