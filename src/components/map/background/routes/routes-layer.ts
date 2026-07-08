import type { GeoJSONSource } from "maplibre-gl";
import type { MapInstance } from "@/lib/map-engine";
import { DECORATIVE_ROUTES, type LngLat } from "../constants";
import {
  buildMaritimePath,
  buildRouteCollection,
  createPathSampler,
  SamplerFunction,
} from "../animations/path-utils";

const ROUTES_SOURCE = "bg-routes-source";
const ROUTES_GLOW_LAYER = "bg-routes-glow-layer";
const ROUTES_LINE_LAYER = "bg-routes-line-layer";

const PARTICLES_SOURCE = "bg-routes-particles-source";
const PARTICLES_LAYER = "bg-routes-particles-layer";

type ParticleState = {
  sampler: SamplerFunction;
  progress: number;
  speed: number; // progress increment per millisecond
};

// Local cache for particles and their samplers
let particles: ParticleState[] = [];
let resolvedRoutes: { id: string; coordinates: LngLat[] }[] = [];

export function addRoutesBackgroundLayer(map: MapInstance) {
  if (map.getSource(ROUTES_SOURCE)) return;

  // Resolve all shipping route coordinates (with linear interpolation for legs)
  resolvedRoutes = DECORATIVE_ROUTES.map((route) => ({
    id: route.id,
    coordinates: buildMaritimePath(route.waypoints),
  }));

  // Create routes source
  map.addSource(ROUTES_SOURCE, {
    type: "geojson",
    data: buildRouteCollection(resolvedRoutes),
  });

  // Soft glow layer
  map.addLayer({
    id: ROUTES_GLOW_LAYER,
    type: "line",
    source: ROUTES_SOURCE,
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#475569", // Slate 600 (blue-gray)
      "line-width": 3,
      "line-opacity": 0.08,
      "line-blur": 1.5,
    },
  });

  // Sharp thin line layer
  map.addLayer({
    id: ROUTES_LINE_LAYER,
    type: "line",
    source: ROUTES_SOURCE,
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#475569", // Slate 600
      "line-width": 0.75,
      "line-opacity": 0.22,
    },
  });

  // Set up particles
  particles = [];
  const particlesGeoJSONFeatures: GeoJSON.Feature[] = [];

  resolvedRoutes.forEach((route, routeIdx) => {
    const sampler = createPathSampler(route.coordinates);
    
    // Create 3 particles per route, staggered
    const numParticles = 3;
    for (let i = 0; i < numParticles; i++) {
      const progress = i / numParticles; // stagger progress
      // Flow very slowly: full loop takes between 120s and 180s
      const durationMs = 120_000 + Math.random() * 60_000;
      const speed = 1 / durationMs;
      
      particles.push({
        sampler,
        progress,
        speed,
      });

      const motion = sampler(progress);
      particlesGeoJSONFeatures.push({
        type: "Feature",
        properties: { id: `p-${routeIdx}-${i}` },
        geometry: {
          type: "Point",
          coordinates: motion.position,
        },
      });
    }
  });

  // Create particles source
  map.addSource(PARTICLES_SOURCE, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: particlesGeoJSONFeatures,
    },
  });

  // Styles for tiny glowing flow particles
  map.addLayer({
    id: PARTICLES_LAYER,
    type: "circle",
    source: PARTICLES_SOURCE,
    paint: {
      "circle-radius": 1,
      "circle-color": "#cbd5e1", // soft white/slate 200
      "circle-opacity": 0.55,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-opacity": 0.15,
    },
  });
}

/** Updates all flow particles along their route path samplers */
export function updateRoutesParticlesLayer(map: MapInstance, deltaTimeMs: number) {
  const source = map.getSource(PARTICLES_SOURCE);
  if (!source || particles.length === 0) return;

  const features: GeoJSON.Feature[] = particles.map((p, idx) => {
    p.progress += deltaTimeMs * p.speed;
    const motion = p.sampler(p.progress);

    return {
      type: "Feature",
      properties: { id: `p-${idx}` },
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

export function removeRoutesBackgroundLayer(map: MapInstance) {
  if (map.getLayer(ROUTES_LINE_LAYER)) {
    map.removeLayer(ROUTES_LINE_LAYER);
  }
  if (map.getLayer(ROUTES_GLOW_LAYER)) {
    map.removeLayer(ROUTES_GLOW_LAYER);
  }
  if (map.getLayer(PARTICLES_LAYER)) {
    map.removeLayer(PARTICLES_LAYER);
  }
  if (map.getSource(ROUTES_SOURCE)) {
    map.removeSource(ROUTES_SOURCE);
  }
  if (map.getSource(PARTICLES_SOURCE)) {
    map.removeSource(PARTICLES_SOURCE);
  }
  particles = [];
  resolvedRoutes = [];
}

export function getResolvedRoutes() {
  return resolvedRoutes;
}
