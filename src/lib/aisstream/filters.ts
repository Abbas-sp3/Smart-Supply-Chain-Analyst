import { INDIA_COAST_DISTANCE_KM } from "./constants";

type Point = {
  latitude: number;
  longitude: number;
};

const ARABIAN_SEA_POLYGON: Point[] = [
  { latitude: 5, longitude: 48 },
  { latitude: 25, longitude: 48 },
  { latitude: 25, longitude: 78 },
  { latitude: 5, longitude: 78 },
];

const BAY_OF_BENGAL_POLYGON: Point[] = [
  { latitude: 5, longitude: 78 },
  { latitude: 22, longitude: 78 },
  { latitude: 22, longitude: 98 },
  { latitude: 5, longitude: 98 },
];

const INDIA_COAST_REFERENCE_POINTS: Point[] = [
  { latitude: 23.0, longitude: 68.5 },
  { latitude: 22.3, longitude: 70.1 },
  { latitude: 19.1, longitude: 72.9 },
  { latitude: 15.3, longitude: 73.9 },
  { latitude: 12.9, longitude: 74.8 },
  { latitude: 11.7, longitude: 75.5 },
  { latitude: 10.0, longitude: 76.2 },
  { latitude: 9.9, longitude: 78.1 },
  { latitude: 13.1, longitude: 80.3 },
  { latitude: 16.7, longitude: 82.3 },
  { latitude: 17.7, longitude: 83.3 },
  { latitude: 19.3, longitude: 84.9 },
  { latitude: 20.3, longitude: 86.7 },
  { latitude: 21.5, longitude: 87.9 },
  { latitude: 22.0, longitude: 88.9 },
  { latitude: 21.7, longitude: 87.5 },
  { latitude: 22.6, longitude: 88.4 },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(a: Point, b: Point) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function isPointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isNearIndiaCoast(point: Point) {
  return INDIA_COAST_REFERENCE_POINTS.some(
    (reference) => haversineKm(point, reference) <= INDIA_COAST_DISTANCE_KM,
  );
}

export function matchesIndiaEnergyCorridorFilter(input: {
  latitude: number;
  longitude: number;
  destination: string;
}) {
  const point = {
    latitude: input.latitude,
    longitude: input.longitude,
  };

  if (input.destination.toLowerCase().includes("india")) {
    return true;
  }

  if (isNearIndiaCoast(point)) {
    return true;
  }

  if (isPointInPolygon(point, ARABIAN_SEA_POLYGON)) {
    return true;
  }

  if (isPointInPolygon(point, BAY_OF_BENGAL_POLYGON)) {
    return true;
  }

  return false;
}

export function sortByRecency<T extends { timestamp: string }>(ships: T[]) {
  return [...ships].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
