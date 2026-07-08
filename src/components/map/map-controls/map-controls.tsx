"use client";

import { Minus, Plus } from "lucide-react";

import { useMap } from "@/components/map/map-provider";

const ZOOM_DURATION_MS = 300;

export function MapControls() {
  const { map, isReady } = useMap();

  if (!isReady || !map) {
    return null;
  }

  const zoomIn = () => {
    map.zoomIn({ duration: ZOOM_DURATION_MS });
  };

  const zoomOut = () => {
    map.zoomOut({ duration: ZOOM_DURATION_MS });
  };

  return (
    <div className="pointer-events-auto absolute bottom-6 right-6 z-[5] flex flex-col gap-1">
      <button
        type="button"
        onClick={zoomIn}
        aria-label="Zoom in"
        className="glass-surface flex size-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <Plus aria-hidden className="size-4" />
      </button>
      <button
        type="button"
        onClick={zoomOut}
        aria-label="Zoom out"
        className="glass-surface flex size-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <Minus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
