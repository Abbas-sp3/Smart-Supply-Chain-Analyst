"use client";

import type { ReactNode } from "react";

import { AppLayoutProvider } from "@/components/app-layout-provider";
import { AppHeader } from "@/components/app-header";
import { AppMainContent } from "@/components/app-main-content";
import { AppSidebar } from "@/components/app-sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <AppLayoutProvider>
      <div className="relative flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <AppMainContent>{children}</AppMainContent>
        </div>
      </div>
    </AppLayoutProvider>
  );
}
