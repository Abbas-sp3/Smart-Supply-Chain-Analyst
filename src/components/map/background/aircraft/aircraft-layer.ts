import type { GeoJSONSource } from "maplibre-gl";
import type { MapInstance } from "@/lib/map-engine";
import { AIRCRAFT_ROUTES } from "../constants";
import { buildCurvedPath, createPathSampler, SamplerFunction } from "../animations/path-utils";

const AIRCRAFT_SOURCE = "bg-aircraft-source";
const AIRCRAFT_LAYER = "bg-aircraft-layer";
const AIRCRAFT_ICON_ID = "bg-aircraft-icon";

// Top-down minimalist cargo plane SVG pointing North (Up)
const AIRCRAFT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
  <!-- Sleek fuselage pointing North -->
  <path d="M12 2 C12.5 2, 13 4, 13 8 L22 11 C22.5 11.2, 22.5 11.8, 22 12 L13 13 L12.5 20 L15 22 L12 22 L9 22 L11.5 20 L11 13 L2 12 C1.5 11.8, 1.5 11.2, 2 11 L11 8 C11 4, 11.5 2, 12 2 Z" fill="#94a3b8" opacity="0.8"/>
</svg>
`.trim();

type AircraftState = {
  sampler: SamplerFunction;
  progress: number;
  speed: number;
  id: string;
};

let aircrafts: AircraftState[] = [];

export function addAircraftBackgroundLayer(map: MapInstance) {
  if (map.getSource(AIRCRAFT_SOURCE)) return;

  // Load the aircraft SVG icon into MapLibre
  if (!map.hasImage(AIRCRAFT_ICON_ID)) {
    const img = new Image(14, 14);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(AIRCRAFT_SVG);
    img.onload = () => {
      if (!map.hasImage(AIRCRAFT_ICON_ID)) {
        map.addImage(AIRCRAFT_ICON_ID, img);
      }
    };
  }

  aircrafts = [];
  const aircraftFeatures: GeoJSON.Feature[] = [];

  // Generate aircraft routes using curved Bezier curves to look like flight paths
  AIRCRAFT_ROUTES.forEach((route, idx) => {
    const curvedCoordinates = buildCurvedPath(route.waypoints);
    const sampler = createPathSampler(curvedCoordinates);

    // 4 planes per flight path (4 routes = 16 planes total)
    const numPlanes = 4;
    for (let i = 0; i < numPlanes; i++) {
      // Stagger start positions along the flight path to prevent bunching
      const progress = (i / numPlanes) + (Math.random() * (1 / numPlanes));
      const durationMs = 60_000 + Math.random() * 30_000; // completes flight in 60-90s
      const speed = 1 / durationMs;
      const planeId = `plane-${idx}-${i}`;

      aircrafts.push({
        sampler,
        progress,
        speed,
        id: planeId,
      });

      const motion = sampler(progress);
      aircraftFeatures.push({
        type: "Feature",
        properties: {
          id: planeId,
          heading: motion.bearing,
        },
        geometry: {
          type: "Point",
          coordinates: motion.position,
        },
      });
    }
  });

  map.addSource(AIRCRAFT_SOURCE, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: aircraftFeatures,
    },
  });

  map.addLayer({
    id: AIRCRAFT_LAYER,
    type: "symbol",
    source: AIRCRAFT_SOURCE,
    layout: {
      "icon-image": AIRCRAFT_ICON_ID,
      "icon-size": 0.8,
      "icon-rotate": ["get", "heading"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-opacity": 0.65,
    },
  });
}

/** Updates coordinates and rotation of all cargo aircraft in WebGL in a single call */
export function updateAircraftBackgroundLayer(map: MapInstance, deltaTimeMs: number) {
  const source = map.getSource(AIRCRAFT_SOURCE);
  if (!source || aircrafts.length === 0) return;

  const features: GeoJSON.Feature[] = aircrafts.map((ac) => {
    ac.progress += deltaTimeMs * ac.speed;
    const motion = ac.sampler(ac.progress);

    return {
      type: "Feature",
      properties: {
        id: ac.id,
        heading: motion.bearing,
      },
      geometry: {
        type: "Point",
        coordinates: motion.position,
      },
    };
  });

  (source as GeoJSONSource).setData({
    type: "FeatureCollection",
    features,
  });
}

export function removeAircraftBackgroundLayer(map: MapInstance) {
  if (!map || typeof map.getLayer !== "function") return;
  if (map.getLayer(AIRCRAFT_LAYER)) {
    map.removeLayer(AIRCRAFT_LAYER);
  }
  if (map.getSource(AIRCRAFT_SOURCE)) {
    map.removeSource(AIRCRAFT_SOURCE);
  }
  aircrafts = [];
}
