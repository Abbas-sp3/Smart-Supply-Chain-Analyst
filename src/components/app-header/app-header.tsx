"use client";

import { Bell, Circle, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useSidebar } from "@/hooks/use-sidebar";
import { APP_NAME } from "@/lib/constants/app";

export function AppHeader() {
  const { collapsed, toggleCollapsed, toggleMobile } = useSidebar();

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
          <p className="text-sm font-medium">{APP_NAME}</p>
          <p className="text-[11px] text-muted-foreground">Command Center</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
          <Circle
            aria-hidden
            className="size-2 fill-emerald-400 text-emerald-400"
          />
          <span>Connected</span>
          <span className="text-white/20">|</span>
          <span className="font-mono">UTC</span>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell aria-hidden className="size-4" />
        </button>
        <div className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-medium text-muted-foreground">
          OP
        </div>
      </div>
    </header>
  );
}
