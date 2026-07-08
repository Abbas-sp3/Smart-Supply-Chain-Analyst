"use client";

import { useEffect } from "react";
import { useMap } from "@/components/map/map-provider";
import { addPortsBackgroundLayer, removePortsBackgroundLayer } from "./ports/ports-layer";
import { addRoutesBackgroundLayer, removeRoutesBackgroundLayer, updateRoutesParticlesLayer } from "./routes/routes-layer";
import { addShipsBackgroundLayer, removeShipsBackgroundLayer, updateShipsBackgroundLayer } from "./ships/ships-layer";
import { addAircraftBackgroundLayer, removeAircraftBackgroundLayer, updateAircraftBackgroundLayer } from "./aircraft/aircraft-layer";

export function MapBackground() {
  const { map, isReady } = useMap();

  useEffect(() => {
    if (!map || !isReady) return;

    // Apply custom minimal geopolitical styling to base map style
    const cleanMapStyle = () => {
      try {
        const layers = map.getStyle().layers;
        if (!layers) return;

        layers.forEach((layer) => {
          const id = layer.id.toLowerCase();
          
          // Define which layers represent base geography we want to KEEP
          const isBaseGeography =
            id.includes("background") ||
            id.includes("land") ||
            id.includes("water") ||
            id.includes("ocean") ||
            id.includes("boundary") ||
            id.includes("border") ||
            id.includes("admin");

          if (!isBaseGeography) {
            // Hide roads, labels, buildings, text, POIs
            map.setLayoutProperty(layer.id, "visibility", "none");
          } else {
            // Recolor base map geography for a premium operations-room look
            // Ocean: almost black. Land: dark charcoal. Borders: subtle.
            if (id.includes("water") || id.includes("ocean")) {
              map.setPaintProperty(layer.id, "fill-color", "#05070c");
            } else if (id.includes("land") || id.includes("background")) {
              map.setPaintProperty(layer.id, "fill-color", "#111622");
            } else if (id.includes("boundary") || id.includes("border") || id.includes("admin")) {
              map.setPaintProperty(layer.id, "line-color", "#1e293b");
              map.setPaintProperty(layer.id, "line-opacity", 0.25);
            }
          }
        });
      } catch (e) {
        console.warn("Could not apply style customisations to the base map:", e);
      }
    };

    cleanMapStyle();

    // Register layers in sequence
    addRoutesBackgroundLayer(map);
    addPortsBackgroundLayer(map);
    addShipsBackgroundLayer(map);
    addAircraftBackgroundLayer(map);

    let lastTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      // Guard against large time jumps (e.g. tab unfocused)
      const safeDt = Math.min(dt, 100);

      // Tick coordinates updates to MapLibre GeoJSON sources
      updateRoutesParticlesLayer(map, safeDt);
      updateShipsBackgroundLayer(map, safeDt);
      updateAircraftBackgroundLayer(map, safeDt);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      removeAircraftBackgroundLayer(map);
      removeShipsBackgroundLayer(map);
      removePortsBackgroundLayer(map);
      removeRoutesBackgroundLayer(map);
    };
  }, [map, isReady]);

  return null;
}
