"use client";

import { useEffect } from "react";

import { useMap } from "@/components/map/map-provider";
import { initCargoAircraft } from "@/components/map/aircraft";
import { addPortsLayer, removePortsLayer } from "@/components/map/ports";
import {
  addEnergyCorridorsLayer,
  removeEnergyCorridorsLayer,
} from "@/components/map/routes";

export function MapVisualLayers() {
  const { map, isReady } = useMap();

  useEffect(() => {
    if (!map || !isReady) {
      return;
    }

    addEnergyCorridorsLayer(map);
    const cleanupPorts = addPortsLayer(map);
    const cleanupAircraft = initCargoAircraft(map);

    return () => {
      cleanupAircraft();
      cleanupPorts();
      removePortsLayer(map);
      removeEnergyCorridorsLayer(map);
    };
  }, [map, isReady]);

  return null;
}
