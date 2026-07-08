import { LngLat } from "../constants";

export type PathSegment = {
  start: LngLat;
  end: LngLat;
  length: number;
};

export type PathMotion = {
  position: LngLat;
  bearing: number;
};

/** Calculates flat distance between coordinates */
export function distance(a: LngLat, b: LngLat): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.hypot(dx, dy);
}

/** Interpolates linearly between a and b at ratio t */
export function interpolate(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Calculates rotation bearing in degrees between two coordinates */
export function calculateBearing(from: LngLat, to: LngLat): number {
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const dLng = ((to[0] - from[0]) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/** Returns the midpoint of a and b with a perpendicular arc offset for curves */
export function midpoint(a: LngLat, b: LngLat, offset: LngLat): LngLat {
  return [
    a[0] + (b[0] - a[0]) * 0.5 + offset[0],
    a[1] + (b[1] - a[1]) * 0.5 + offset[1],
  ];
}

/** Calculates an arc offset for Bezier curves based on route distance */
export function arcOffset(start: LngLat, end: LngLat): LngLat {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy) || 1;
  const curvature = Math.min(length * 0.08, 6);
  return [(-dy / length) * curvature, (dx / length) * curvature];
}

/** Evaluates a quadratic bezier curve at t (0 to 1) */
export function quadraticBezier(
  p0: LngLat,
  p1: LngLat,
  p2: LngLat,
  t: number
): LngLat {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

/** Builds a curved route line coordinates list using quadratic Bezier legs */
export function buildCurvedPath(waypoints: LngLat[], segmentsPerLeg = 24): LngLat[] {
  if (waypoints.length < 2) return waypoints;
  const path: LngLat[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const control = midpoint(start, end, arcOffset(start, end));

    for (let step = 0; step <= segmentsPerLeg; step++) {
      if (i > 0 && step === 0) continue; // Avoid duplicate intermediate points
      const t = step / segmentsPerLeg;
      path.push(quadraticBezier(start, control, end, t));
    }
  }

  return path;
}

/** Builds standard linear segment list */
export function buildMaritimePath(waypoints: LngLat[], segmentsPerLeg = 12): LngLat[] {
  if (waypoints.length < 2) return waypoints;
  const path: LngLat[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    for (let step = 0; step <= segmentsPerLeg; step++) {
      if (i > 0 && step === 0) continue;
      const t = step / segmentsPerLeg;
      path.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }

  return path;
}

export type SamplerFunction = (progress: number) => PathMotion;

/** Creates a function that maps path progress (0..1) to LngLat coordinates and bearing */
export function createPathSampler(path: LngLat[]): SamplerFunction {
  if (path.length === 0) {
    return () => ({ position: [0, 0], bearing: 0 });
  }
  if (path.length === 1) {
    return () => ({ position: path[0], bearing: 0 });
  }

  // Pre-calculate segments
  const segments: PathSegment[] = [];
  let totalLength = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    const len = distance(start, end);
    segments.push({ start, end, length: len });
    totalLength += len;
  }

  return (progress: number): PathMotion => {
    // Loop progress between 0 and 1
    const wrapped = ((progress % 1) + 1) % 1;
    let remaining = wrapped * totalLength;

    for (const segment of segments) {
      if (remaining <= segment.length) {
        const ratio = segment.length > 0 ? remaining / segment.length : 0;
        return {
          position: interpolate(segment.start, segment.end, ratio),
          bearing: calculateBearing(segment.start, segment.end),
        };
      }
      remaining -= segment.length;
    }

    const last = segments[segments.length - 1];
    return {
      position: last.end,
      bearing: calculateBearing(last.start, last.end),
    };
  };
}

/** Generates a GeoJSON LineString FeatureCollection representing multiple routes */
export function buildRouteCollection(
  routes: { id: string; coordinates: LngLat[] }[]
) {
  return {
    type: "FeatureCollection" as const,
    features: routes.map((route) => ({
      type: "Feature" as const,
      properties: { id: route.id },
      geometry: {
        type: "LineString" as const,
        coordinates: route.coordinates,
      },
    })),
  };
}

/** Generates a GeoJSON Point FeatureCollection */
export function buildPointCollection(
  points: { id: string; coordinates: LngLat }[]
) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      properties: { id: p.id },
      geometry: {
        type: "Point" as const,
        coordinates: p.coordinates,
      },
    })),
  };
}
