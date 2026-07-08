export type LngLat = [number, number];

export function buildMaritimePath(
  waypoints: LngLat[],
  segmentsPerLeg = 12,
): LngLat[] {
  if (waypoints.length < 2) {
    return waypoints;
  }

  const path: LngLat[] = [];

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const start = waypoints[i];
    const end = waypoints[i + 1];

    for (let step = 0; step <= segmentsPerLeg; step += 1) {
      if (i > 0 && step === 0) {
        continue;
      }

      const t = step / segmentsPerLeg;
      path.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }

  return path;
}

/** Smooth quadratic bezier between consecutive waypoints. */
export function buildCurvedPath(
  waypoints: LngLat[],
  segmentsPerLeg = 24,
): LngLat[] {
  if (waypoints.length < 2) {
    return waypoints;
  }

  const path: LngLat[] = [];

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const control = midpoint(start, end, arcOffset(start, end));

    for (let step = 0; step <= segmentsPerLeg; step += 1) {
      if (i > 0 && step === 0) {
        continue;
      }

      const t = step / segmentsPerLeg;
      path.push(quadraticBezier(start, control, end, t));
    }
  }

  return path;
}

function midpoint(a: LngLat, b: LngLat, offset: LngLat): LngLat {
  return [a[0] + (b[0] - a[0]) * 0.5 + offset[0], a[1] + (b[1] - a[1]) * 0.5 + offset[1]];
}

function arcOffset(start: LngLat, end: LngLat): LngLat {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy) || 1;
  const curvature = Math.min(length * 0.08, 6);

  return [(-dy / length) * curvature, (dx / length) * curvature];
}

function quadraticBezier(p0: LngLat, p1: LngLat, p2: LngLat, t: number): LngLat {
  const u = 1 - t;

  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

export function buildRouteCollection(
  routes: {
    id: string;
    coordinates: LngLat[];
    status?: string;
    name?: string;
  }[],
) {
  return {
    type: "FeatureCollection" as const,
    features: routes.map((route) => ({
      type: "Feature" as const,
      properties: {
        id: route.id,
        status: route.status ?? "normal",
        name: route.name ?? route.id,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: route.coordinates,
      },
    })),
  };
}

export function buildPointCollection(
  points: { id: string; coordinates: LngLat; name?: string; country?: string }[],
) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((point) => ({
      type: "Feature" as const,
      properties: {
        id: point.id,
        name: point.name ?? point.id,
        country: point.country ?? "",
      },
      geometry: {
        type: "Point" as const,
        coordinates: point.coordinates,
      },
    })),
  };
}
