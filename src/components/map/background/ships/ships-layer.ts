import type { GeoJSONSource } from "maplibre-gl";
import type { MapInstance } from "@/lib/map-engine";
import { getResolvedRoutes } from "../routes/routes-layer";
import { createPathSampler, SamplerFunction } from "../animations/path-utils";

const SHIPS_SOURCE = "bg-ships-source";
const SHIPS_LAYER = "bg-ships-layer";
const SHIP_ICON_ID = "bg-ship-icon";

// Top-down minimalist cargo ship SVG pointing North (Up)
const SHIP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
  <!-- Sleek hull shape pointing North -->
  <path d="M12 2 C15 7, 16 12, 16 20 C16 21.5, 14.5 22, 12 22 C9.5 22, 8 21.5, 8 20 C8 12, 9 7, 12 2 Z" fill="#64748b" stroke="#475569" stroke-width="1"/>
  <!-- Front bridge/bow detail -->
  <path d="M10 6 L12 3 L14 6" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
  <!-- Container Stacks (visual cargo blocks) -->
  <rect x="10" y="8" width="4" height="3" rx="0.5" fill="#334155" stroke="#94a3b8" stroke-width="0.5"/>
  <rect x="10" y="12" width="4" height="3" rx="0.5" fill="#334155" stroke="#94a3b8" stroke-width="0.5"/>
  <rect x="10" y="16" width="4" height="3" rx="0.5" fill="#334155" stroke="#94a3b8" stroke-width="0.5"/>
</svg>
`.trim();

type ShipState = {
  sampler: SamplerFunction;
  progress: number;
  speed: number; // progress increment per ms
  id: string;
};

let ships: ShipState[] = [];

export function addShipsBackgroundLayer(map: MapInstance) {
  if (map.getSource(SHIPS_SOURCE)) return;

  const resolvedRoutes = getResolvedRoutes();
  if (resolvedRoutes.length === 0) return;

  // Load the ship SVG icon into MapLibre
  if (!map.hasImage(SHIP_ICON_ID)) {
    const img = new Image(14, 14);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SHIP_SVG);
    img.onload = () => {
      if (!map.hasImage(SHIP_ICON_ID)) {
        map.addImage(SHIP_ICON_ID, img);
      }
    };
  }

  ships = [];
  const shipFeatures: GeoJSON.Feature[] = [];

  // Distribute more cargo ships (approx 6-8 ships per route for the 7 routes -> ~44 ships total)
  resolvedRoutes.forEach((route, routeIdx) => {
    const sampler = createPathSampler(route.coordinates);
    const numShips = routeIdx === 0 || routeIdx === 1 || routeIdx === 4 || routeIdx === 5 ? 7 : 5; // busier routes get 7, others get 5

    for (let i = 0; i < numShips; i++) {
      // Stagger start positions along the route to prevent bunching
      const progress = (i / numShips) + (Math.random() * (1 / numShips));
      
      // Ships move VERY slowly (takes between 180s and 300s to complete a full loop)
      const loopDurationMs = 180_000 + Math.random() * 120_000;
      const speed = 1 / loopDurationMs;
      const shipId = `ship-${routeIdx}-${i}`;

      ships.push({
        sampler,
        progress,
        speed,
        id: shipId,
      });

      const motion = sampler(progress);
      shipFeatures.push({
        type: "Feature",
        properties: {
          id: shipId,
          heading: motion.bearing,
        },
        geometry: {
          type: "Point",
          coordinates: motion.position,
        },
      });
    }
  });

  // Add GeoJSON source for ships
  map.addSource(SHIPS_SOURCE, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: shipFeatures,
    },
  });

  // Render ships as a symbol layer pointing in direction of travel
  map.addLayer({
    id: SHIPS_LAYER,
    type: "symbol",
    source: SHIPS_SOURCE,
    layout: {
      "icon-image": SHIP_ICON_ID,
      "icon-size": 0.85,
      "icon-rotate": ["get", "heading"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-opacity": 0.75, // Subtle, soft blend
    },
  });
}

/** Updates coordinates and rotation of all cargo ships in WebGL in a single call */
export function updateShipsBackgroundLayer(map: MapInstance, deltaTimeMs: number) {
  const source = map.getSource(SHIPS_SOURCE);
  if (!source || ships.length === 0) return;

  const features: GeoJSON.Feature[] = ships.map((ship) => {
    ship.progress += deltaTimeMs * ship.speed;
    const motion = ship.sampler(ship.progress);

    return {
      type: "Feature",
      properties: {
        id: ship.id,
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

export function removeShipsBackgroundLayer(map: MapInstance) {
  if (!map || typeof map.getLayer !== "function") return;
  if (map.getLayer(SHIPS_LAYER)) {
    map.removeLayer(SHIPS_LAYER);
  }
  if (map.getSource(SHIPS_SOURCE)) {
    map.removeSource(SHIPS_SOURCE);
  }
  ships = [];
}
