import type { ReactNode } from "react";

type MapOverlayRootProps = {
  children?: ReactNode;
};

/**
 * Extension point for future map overlays (routes, vessels, ports, etc.).
 * Renders above the map canvas and below workspace UI panels.
 */
export function MapOverlayRoot({ children }: MapOverlayRootProps) {
  return (
    <div
      aria-hidden={!children}
      className="pointer-events-none absolute inset-0 z-[1]"
    >
      {children}
    </div>
  );
}
