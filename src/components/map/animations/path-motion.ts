import type { LngLat } from "./curve-path";

type PathSegment = {
  start: LngLat;
  end: LngLat;
  length: number;
};

export type PathMotion = {
  position: LngLat;
  bearing: number;
};

export function createPathSampler(path: LngLat[]) {
  const segments = buildSegments(path);
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);

  return (progress: number): PathMotion => {
    if (path.length === 0) {
      return { position: [0, 0], bearing: 0 };
    }

    if (path.length === 1 || totalLength === 0) {
      return { position: path[0], bearing: 0 };
    }

    const wrapped = ((progress % 1) + 1) % 1;
    let remaining = wrapped * totalLength;

    for (const segment of segments) {
      if (remaining <= segment.length) {
        const ratio = remaining / segment.length;

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

function buildSegments(path: LngLat[]): PathSegment[] {
  const segments: PathSegment[] = [];

  for (let i = 0; i < path.length - 1; i += 1) {
    const start = path[i];
    const end = path[i + 1];
    const length = distance(start, end);

    segments.push({ start, end, length });
  }

  return segments;
}

function distance(a: LngLat, b: LngLat) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];

  return Math.hypot(dx, dy);
}

function interpolate(a: LngLat, b: LngLat, t: number): LngLat {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function calculateBearing(from: LngLat, to: LngLat) {
  const lat1 = toRadians(from[1]);
  const lat2 = toRadians(to[1]);
  const dLng = toRadians(to[0] - from[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = toDegrees(Math.atan2(y, x));

  return (bearing + 360) % 360;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

export function createAnimationLoop(callback: (timestamp: number) => void) {
  let frameId = 0;

  const tick = (timestamp: number) => {
    callback(timestamp);
    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frameId);
  };
}
