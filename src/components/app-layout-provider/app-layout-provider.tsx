"use client";

import type { ReactNode } from "react";

import { SidebarProvider } from "@/hooks/use-sidebar";

type AppLayoutProviderProps = {
  children: ReactNode;
};

export function AppLayoutProvider({ children }: AppLayoutProviderProps) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
