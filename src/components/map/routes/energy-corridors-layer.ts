import type { MapInstance } from "@/lib/map-engine";

import {
  buildMaritimePath,
  buildRouteCollection,
} from "@/components/map/animations";
import { ENERGY_CORRIDOR_DEFINITIONS } from "./constants/energy-corridors";
import {
  CORRIDOR_LINE_OPACITY,
  CORRIDOR_LINE_WIDTH,
} from "./constants/corridor-styles";
import {
  ENERGY_CORRIDORS_LAYER,
  ENERGY_CORRIDORS_SOURCE,
} from "./constants/layer-ids";
import type { EnergyCorridorDefinition } from "./types";

export type ResolvedEnergyCorridor = EnergyCorridorDefinition & {
  coordinates: [number, number][];
};

export function getEnergyCorridors(): ResolvedEnergyCorridor[] {
  return ENERGY_CORRIDOR_DEFINITIONS.map((corridor) => ({
    ...corridor,
    coordinates: buildMaritimePath(corridor.waypoints),
  }));
}

export function addEnergyCorridorsLayer(map: MapInstance) {
  const corridors = getEnergyCorridors();

  map.addSource(ENERGY_CORRIDORS_SOURCE, {
    type: "geojson",
    data: buildRouteCollection(
      corridors.map((corridor) => ({
        id: corridor.id,
        name: corridor.name,
        status: corridor.status,
        coordinates: corridor.coordinates,
      })),
    ),
  });

  map.addLayer({
    id: ENERGY_CORRIDORS_LAYER,
    type: "line",
    source: ENERGY_CORRIDORS_SOURCE,
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": [
        "match",
        ["get", "status"],
        "selected",
        "#22d3ee",
        "disrupted",
        "#fbbf24",
        "closed",
        "#ef4444",
        "#64748b",
      ],
      "line-width": CORRIDOR_LINE_WIDTH,
      "line-opacity": CORRIDOR_LINE_OPACITY,
    },
  });
}

export function removeEnergyCorridorsLayer(map: MapInstance) {
  if (map.getLayer(ENERGY_CORRIDORS_LAYER)) {
    map.removeLayer(ENERGY_CORRIDORS_LAYER);
  }

  if (map.getSource(ENERGY_CORRIDORS_SOURCE)) {
    map.removeSource(ENERGY_CORRIDORS_SOURCE);
  }
}
