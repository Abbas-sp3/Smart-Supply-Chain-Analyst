import type { MapInstance } from "@/lib/map-engine";
import { PORTS } from "../constants";
import { buildPointCollection } from "../animations/path-utils";

const PORTS_SOURCE = "bg-ports-source";
const PORTS_CORE_LAYER = "bg-ports-core-layer";
const PORTS_HALO_LAYER = "bg-ports-halo-layer";

export function addPortsBackgroundLayer(map: MapInstance) {
  if (map.getSource(PORTS_SOURCE)) return;

  map.addSource(PORTS_SOURCE, {
    type: "geojson",
    data: buildPointCollection(
      PORTS.map((port) => ({
        id: port.id,
        coordinates: port.coordinates,
      }))
    ),
  });

  // Glowing halo layer (renders below core)
  map.addLayer({
    id: PORTS_HALO_LAYER,
    type: "circle",
    source: PORTS_SOURCE,
    paint: {
      "circle-radius": 7,
      "circle-color": "#d97706",
      "circle-opacity": 0.15,
      "circle-blur": 0.7,
    },
  });

  // Tiny crisp core layer
  map.addLayer({
    id: PORTS_CORE_LAYER,
    type: "circle",
    source: PORTS_SOURCE,
    paint: {
      "circle-radius": 2,
      "circle-color": "#fbbf24",
      "circle-opacity": 0.8,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "#fde68a",
      "circle-stroke-opacity": 0.3,
    },
  });
}

export function removePortsBackgroundLayer(map: MapInstance) {
  if (map.getLayer(PORTS_CORE_LAYER)) {
    map.removeLayer(PORTS_CORE_LAYER);
  }
  if (map.getLayer(PORTS_HALO_LAYER)) {
    map.removeLayer(PORTS_HALO_LAYER);
  }
  if (map.getSource(PORTS_SOURCE)) {
    map.removeSource(PORTS_SOURCE);
  }
}
