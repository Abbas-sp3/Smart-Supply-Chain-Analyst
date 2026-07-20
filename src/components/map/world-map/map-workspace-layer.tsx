"use client";

import { MapControls } from "@/components/map/map-controls";
import { MapProvider } from "@/components/map/map-provider";
import { MapOverlayRoot } from "@/components/map/overlays";
import { MapBackground } from "@/components/map/background";
import { ShipLayer } from "@/components/map/ships";
import { AisStatusBadge } from "@/components/map/ships/AisStatusBadge";
import { AisStatusProvider } from "@/lib/aisstream/ais-status-context";
import { MapVisualLayers } from "./map-visual-layers";

import { WorldMap } from "./world-map";

export function MapWorkspaceLayer() {
  return (
    <AisStatusProvider>
      <MapProvider>
        <div className="absolute inset-0 z-0">
          <WorldMap />
          <MapBackground />
          <ShipLayer />
          <MapVisualLayers />
        </div>
        <MapOverlayRoot />
        <MapControls />
        {/* AIS connection status badge — bottom-left of map, above zoom controls */}
        <div className="pointer-events-none absolute bottom-6 left-6 z-[5]">
          <AisStatusBadge />
        </div>
      </MapProvider>
    </AisStatusProvider>
  );
}
