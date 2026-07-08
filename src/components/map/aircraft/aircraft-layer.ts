"use client";

import type { MapInstance } from "@/lib/map-engine";
import { Marker } from "@/lib/maplibre/client";
import {
  createAnimationLoop,
  createPathSampler,
} from "@/components/map/animations";

import { CARGO_AIRCRAFT_ASSIGNMENTS } from "./constants/cargo-aircraft";
import {
  createCargoAircraftElement,
  updateCargoAircraftElement,
} from "./aircraft-marker";

export function initCargoAircraft(map: MapInstance) {
  const aircraft = CARGO_AIRCRAFT_ASSIGNMENTS.map((config) => {
    const sampler = createPathSampler(config.path);
    const element = createCargoAircraftElement();
    const initialMotion = sampler(config.offset);

    const marker = new Marker({
      element,
      anchor: "center",
      rotationAlignment: "map",
    })
      .setLngLat(initialMotion.position)
      .addTo(map);

    updateCargoAircraftElement(element, initialMotion.bearing);

    return { config, sampler, marker, element };
  });

  const startTime = performance.now();

  const stop = createAnimationLoop((timestamp) => {
    for (const item of aircraft) {
      const elapsed = timestamp - startTime;
      const progress = item.config.offset + elapsed / item.config.durationMs;
      const motion = item.sampler(progress);

      item.marker.setLngLat(motion.position);
      updateCargoAircraftElement(item.element, motion.bearing);
    }
  });

  return () => {
    stop();

    for (const item of aircraft) {
      item.marker.remove();
    }
  };
}
