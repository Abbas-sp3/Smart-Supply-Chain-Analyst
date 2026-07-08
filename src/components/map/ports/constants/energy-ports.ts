import type { LngLat } from "@/components/map/animations";

export type EnergyPortDefinition = {
  id: string;
  name: string;
  country: string;
  coordinates: LngLat;
};

export const ENERGY_PORTS: EnergyPortDefinition[] = [
  { id: "ras-tanura", name: "Ras Tanura", country: "Saudi Arabia", coordinates: [50.1583, 26.6406] },
  { id: "juaymah", name: "Ju'aymah", country: "Saudi Arabia", coordinates: [50.0083, 26.1167] },
  { id: "fujairah", name: "Fujairah", country: "UAE", coordinates: [56.3564, 25.1289] },
  { id: "ruwais", name: "Ruwais", country: "UAE", coordinates: [52.73, 24.11] },
  { id: "ras-laffan", name: "Ras Laffan", country: "Qatar", coordinates: [51.5467, 25.9183] },
  { id: "kharg-island", name: "Kharg Island", country: "Iran", coordinates: [50.3125, 29.2333] },
  { id: "basra-oil-terminal", name: "Basra Oil Terminal", country: "Iraq", coordinates: [48.8167, 29.6833] },
  { id: "jamnagar", name: "Jamnagar", country: "India", coordinates: [70.0667, 22.47] },
  { id: "mundra", name: "Mundra", country: "India", coordinates: [69.7, 22.75] },
  { id: "mumbai", name: "Mumbai", country: "India", coordinates: [72.8777, 19.076] },
  { id: "mangalore", name: "Mangalore", country: "India", coordinates: [74.787, 12.9141] },
  { id: "paradip", name: "Paradip", country: "India", coordinates: [86.6689, 20.3167] },
  { id: "visakhapatnam", name: "Visakhapatnam", country: "India", coordinates: [83.3039, 17.6868] },
  { id: "rotterdam", name: "Rotterdam", country: "Netherlands", coordinates: [4.4792, 51.9225] },
  { id: "singapore", name: "Singapore", country: "Singapore", coordinates: [103.8198, 1.3521] },
  { id: "shanghai", name: "Shanghai", country: "China", coordinates: [121.4737, 31.2304] },
];

export const LOGISTICS_HUBS = {
  singapore: [103.8198, 1.3521] as LngLat,
  dubai: [55.0272, 25.003] as LngLat,
  mumbai: [72.8777, 19.076] as LngLat,
  rotterdam: [4.4792, 51.9225] as LngLat,
  shanghai: [121.4737, 31.2304] as LngLat,
};

export type CargoAircraftRouteDefinition = {
  id: string;
  originHub: keyof typeof LOGISTICS_HUBS;
  destinationHub: keyof typeof LOGISTICS_HUBS;
  waypoints: LngLat[];
};

export const CARGO_AIRCRAFT_ROUTE_DEFINITIONS: CargoAircraftRouteDefinition[] = [
  {
    id: "singapore-dubai",
    originHub: "singapore",
    destinationHub: "dubai",
    waypoints: [LOGISTICS_HUBS.singapore, [75, 18], LOGISTICS_HUBS.dubai],
  },
  {
    id: "dubai-mumbai",
    originHub: "dubai",
    destinationHub: "mumbai",
    waypoints: [LOGISTICS_HUBS.dubai, [65, 22], LOGISTICS_HUBS.mumbai],
  },
  {
    id: "mumbai-shanghai",
    originHub: "mumbai",
    destinationHub: "shanghai",
    waypoints: [LOGISTICS_HUBS.mumbai, [92, 24], [108, 28], LOGISTICS_HUBS.shanghai],
  },
  {
    id: "rotterdam-singapore",
    originHub: "rotterdam",
    destinationHub: "singapore",
    waypoints: [LOGISTICS_HUBS.rotterdam, [45, 38], [65, 28], LOGISTICS_HUBS.singapore],
  },
];
