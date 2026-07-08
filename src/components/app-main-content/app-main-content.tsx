import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const MapWorkspaceLayer = dynamic(
  () =>
    import("@/components/map/world-map").then(
      (module) => module.MapWorkspaceLayer,
    ),
  { ssr: false },
);

type AppMainContentProps = {
  children: ReactNode;
};

export function AppMainContent({ children }: AppMainContentProps) {
  return (
    <main className="workspace-canvas relative flex-1 overflow-hidden">
      <MapWorkspaceLayer />
      <div className="pointer-events-none absolute inset-0 z-10 overflow-y-auto">
        {children}
      </div>
    </main>
  );
}
