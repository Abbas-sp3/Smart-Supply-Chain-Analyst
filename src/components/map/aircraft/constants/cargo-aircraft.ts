import { buildMaritimePath } from "@/components/map/animations";
import { CARGO_AIRCRAFT_ROUTE_DEFINITIONS } from "@/components/map/ports/constants/energy-ports";

export type CargoAircraftAssignment = {
  id: string;
  path: [number, number][];
  durationMs: number;
  offset: number;
};

export const CARGO_AIRCRAFT_ASSIGNMENTS: CargoAircraftAssignment[] =
  CARGO_AIRCRAFT_ROUTE_DEFINITIONS.map((route, index) => ({
    id: `air-${route.id}`,
    path: buildMaritimePath(route.waypoints, 16),
    durationMs: 120_000 + index * 15_000,
    offset: index * 0.12,
  }));
