import type { LngLat } from "@/components/map/animations";

export type CorridorStatus = "normal" | "selected" | "disrupted" | "closed";

export type EnergyCorridorId =
  | "gulf-hormuz-india-jamnagar"
  | "gulf-hormuz-singapore"
  | "gulf-redsea-suez-rotterdam"
  | "gulf-cape-europe"
  | "australia-lng-singapore-india"
  | "usg-panama-asia";

export type EnergyCorridorDefinition = {
  id: EnergyCorridorId;
  name: string;
  commodity: "oil" | "lng" | "mixed";
  status: CorridorStatus;
  /** Sea-lane waypoints in route order [lng, lat]. */
  waypoints: LngLat[];
};

export const ENERGY_CORRIDOR_DEFINITIONS: EnergyCorridorDefinition[] = [
  {
    id: "gulf-hormuz-india-jamnagar",
    name: "Persian Gulf → Hormuz → Arabian Sea → Jamnagar",
    commodity: "oil",
    status: "normal",
    waypoints: [
      [50.15, 26.64],
      [52.8, 26.2],
      [56.5, 26.4],
      [59.5, 24.5],
      [62.5, 22.0],
      [65.5, 20.5],
      [68.2, 21.0],
      [70.07, 22.47],
    ],
  },
  {
    id: "gulf-hormuz-singapore",
    name: "Persian Gulf → Hormuz → Singapore",
    commodity: "oil",
    status: "normal",
    waypoints: [
      [50.5, 27.0],
      [54.0, 26.5],
      [56.5, 26.2],
      [60.0, 22.0],
      [65.0, 15.0],
      [72.0, 8.0],
      [85.0, 5.0],
      [95.0, 3.5],
      [100.5, 2.0],
      [103.82, 1.35],
    ],
  },
  {
    id: "gulf-redsea-suez-rotterdam",
    name: "Persian Gulf → Red Sea → Suez → Rotterdam",
    commodity: "oil",
    status: "normal",
    waypoints: [
      [50.0, 27.2],
      [55.0, 26.0],
      [57.5, 24.0],
      [52.0, 18.0],
      [48.0, 13.0],
      [43.0, 12.8],
      [40.0, 18.0],
      [36.5, 23.0],
      [34.0, 27.5],
      [32.55, 29.95],
      [28.0, 33.0],
      [20.0, 36.0],
      [12.0, 38.0],
      [3.0, 42.0],
      [4.48, 51.92],
    ],
  },
  {
    id: "gulf-cape-europe",
    name: "Persian Gulf → Cape of Good Hope → Europe",
    commodity: "oil",
    status: "normal",
    waypoints: [
      [49.5, 27.5],
      [56.0, 25.5],
      [58.0, 20.0],
      [55.0, 12.0],
      [50.0, 5.0],
      [48.0, -2.0],
      [45.0, -12.0],
      [42.0, -22.0],
      [30.0, -32.0],
      [18.0, -35.0],
      [5.0, -30.0],
      [-10.0, -15.0],
      [-15.0, 0.0],
      [-10.0, 25.0],
      [-5.0, 42.0],
      [4.48, 51.92],
    ],
  },
  {
    id: "australia-lng-singapore-india",
    name: "Australia LNG → Singapore → India",
    commodity: "lng",
    status: "normal",
    waypoints: [
      [115.4, -20.8],
      [118.0, -15.0],
      [125.0, -10.0],
      [115.0, -5.0],
      [105.0, 0.0],
      [103.82, 1.35],
      [95.0, 8.0],
      [85.0, 12.0],
      [79.0, 15.0],
      [72.88, 19.08],
    ],
  },
  {
    id: "usg-panama-asia",
    name: "US Gulf Coast → Panama Canal → Asia",
    commodity: "mixed",
    status: "normal",
    waypoints: [
      [-90.0, 28.5],
      [-88.5, 25.0],
      [-85.0, 20.0],
      [-82.0, 15.0],
      [-79.92, 9.08],
      [-85.0, 5.0],
      [-100.0, 8.0],
      [-130.0, 15.0],
      [-160.0, 22.0],
      [-175.0, 28.0],
      [145.0, 30.0],
      [130.0, 28.0],
      [121.47, 31.23],
    ],
  },
];

export const ENERGY_CORRIDOR_IDS = ENERGY_CORRIDOR_DEFINITIONS.map(
  (corridor) => corridor.id,
);
