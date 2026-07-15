"use client";

import { MapControls } from "@/components/map/map-controls";
import { MapProvider } from "@/components/map/map-provider";
import { MapOverlayRoot } from "@/components/map/overlays";
import { MapBackground } from "@/components/map/background";
import { ShipLayer } from "@/components/map/ships";
import { MapVisualLayers } from "./map-visual-layers";

import { WorldMap } from "./world-map";

export function MapWorkspaceLayer() {
  return (
    <MapProvider>
      <div className="absolute inset-0 z-0">
        <WorldMap />
        <MapBackground />
        <ShipLayer />
        <MapVisualLayers />
      </div>
      <MapOverlayRoot />
      <MapControls />
    </MapProvider>
  );
}
