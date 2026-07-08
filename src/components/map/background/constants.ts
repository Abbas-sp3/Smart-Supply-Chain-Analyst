export type LngLat = [number, number];

export type PortDefinition = {
  id: string;
  name: string;
  coordinates: LngLat;
};

// Major ports requested
export const PORTS: PortDefinition[] = [
  { id: "ras-tanura", name: "Ras Tanura", coordinates: [50.1583, 26.6406] },
  { id: "basra", name: "Basra", coordinates: [48.8167, 29.6833] },
  { id: "fujairah", name: "Fujairah", coordinates: [56.3564, 25.1289] },
  { id: "jamnagar", name: "Jamnagar", coordinates: [70.0667, 22.47] },
  { id: "mundra", name: "Mundra", coordinates: [69.7, 22.75] },
  { id: "mumbai", name: "Mumbai", coordinates: [72.8777, 19.076] },
  { id: "singapore", name: "Singapore", coordinates: [103.8198, 1.3521] },
  { id: "shanghai", name: "Shanghai", coordinates: [121.4737, 31.2304] },
  { id: "rotterdam", name: "Rotterdam", coordinates: [4.4792, 51.9225] },
];

// Logistics hubs for aircraft
export const LOGISTICS_HUBS = {
  singapore: [103.8198, 1.3521] as LngLat,
  dubai: [55.0272, 25.003] as LngLat,
  mumbai: [72.8777, 19.076] as LngLat,
  rotterdam: [4.4792, 51.9225] as LngLat,
  shanghai: [121.4737, 31.2304] as LngLat,
};

export type RouteDefinition = {
  id: string;
  name: string;
  waypoints: LngLat[];
};

export const DECORATIVE_ROUTES: RouteDefinition[] = [
  {
    id: "gulf-hormuz-india",
    name: "Persian Gulf → Strait of Hormuz → West Coast India",
    waypoints: [
      [50.1583, 26.6406], // Ras Tanura
      [52.8, 26.2],
      [56.3564, 25.1289], // Fujairah / Hormuz
      [59.5, 24.5],
      [62.5, 22.0],
      [65.5, 20.5],
      [68.5, 21.5],
      [69.7, 22.75], // Mundra
      [70.0667, 22.47], // Jamnagar
    ],
  },
  {
    id: "gulf-singapore",
    name: "Persian Gulf → Singapore",
    waypoints: [
      [50.1583, 26.6406], // Ras Tanura
      [54.0, 26.5],
      [56.3564, 25.1289], // Fujairah
      [60.0, 22.0],
      [65.0, 15.0],
      [72.0, 8.0],
      [80.0, 5.0],
      [90.0, 4.0],
      [98.0, 2.5],
      [103.8198, 1.3521], // Singapore
    ],
  },
  {
    id: "gulf-suez-europe",
    name: "Persian Gulf → Suez Canal → Europe",
    waypoints: [
      [50.1583, 26.6406], // Ras Tanura
      [56.3564, 25.1289], // Fujairah
      [50.0, 15.0],
      [43.0, 12.8],       // Bab-el-Mandeb
      [38.0, 20.0],       // Red Sea
      [32.55, 29.95],     // Suez
      [25.0, 34.0],       // Med Sea
      [15.0, 37.0],
      [5.0, 36.0],
      [-5.5, 36.0],       // Gibraltar
      [-9.5, 40.0],
      [-5.0, 48.0],
      [2.0, 50.0],
      [4.4792, 51.9225],  // Rotterdam
    ],
  },
  {
    id: "gulf-cape-europe",
    name: "Persian Gulf → Cape of Good Hope → Europe",
    waypoints: [
      [50.1583, 26.6406], // Ras Tanura
      [56.3564, 25.1289], // Fujairah
      [58.0, 20.0],
      [55.0, 10.0],
      [45.0, -12.0],
      [30.0, -32.0],
      [18.0, -34.8],      // Cape of Good Hope
      [5.0, -25.0],
      [-10.0, -10.0],
      [-15.0, 5.0],
      [-15.0, 25.0],
      [-10.0, 40.0],
      [-5.0, 47.0],
      [2.0, 49.5],
      [4.4792, 51.9225],  // Rotterdam
    ],
  },
  {
    id: "singapore-india",
    name: "Singapore → India",
    waypoints: [
      [103.8198, 1.3521], // Singapore
      [98.0, 5.5],
      [90.0, 8.0],
      [80.0, 9.5],
      [77.0, 8.0],        // South of India / Sri Lanka
      [73.5, 12.0],
      [72.8777, 19.076],  // Mumbai
      [70.0667, 22.47],   // Jamnagar
    ],
  },
  {
    id: "china-singapore-india",
    name: "China → Singapore → India",
    waypoints: [
      [121.4737, 31.2304], // Shanghai
      [120.0, 25.0],
      [115.0, 15.0],
      [109.0, 8.0],
      [104.5, 2.5],
      [103.8198, 1.3521],  // Singapore
      [98.0, 5.5],
      [90.0, 8.0],
      [80.0, 9.5],
      [77.0, 8.0],         // Sri Lanka
      [73.5, 12.0],
      [72.8777, 19.076],   // Mumbai
    ],
  },
  {
    id: "europe-suez-india",
    name: "Europe → Suez → India",
    waypoints: [
      [4.4792, 51.9225],   // Rotterdam
      [-5.0, 48.0],
      [-5.5, 36.0],        // Gibraltar
      [15.0, 37.0],
      [32.55, 29.95],      // Suez
      [38.0, 20.0],        // Red Sea
      [43.0, 12.8],        // Bab-el-Mandeb
      [55.0, 13.0],
      [63.0, 16.0],
      [70.0667, 22.47],    // Jamnagar
    ],
  },
];

export const AIRCRAFT_ROUTES = [
  {
    id: "air-singapore-dubai",
    waypoints: [LOGISTICS_HUBS.singapore, [75, 18] as LngLat, LOGISTICS_HUBS.dubai],
  },
  {
    id: "air-dubai-mumbai",
    waypoints: [LOGISTICS_HUBS.dubai, [65, 22] as LngLat, LOGISTICS_HUBS.mumbai],
  },
  {
    id: "air-mumbai-shanghai",
    waypoints: [LOGISTICS_HUBS.mumbai, [92, 24] as LngLat, [108, 28] as LngLat, LOGISTICS_HUBS.shanghai],
  },
  {
    id: "air-rotterdam-singapore",
    waypoints: [LOGISTICS_HUBS.rotterdam, [45, 38] as LngLat, [65, 28] as LngLat, LOGISTICS_HUBS.singapore],
  },
];
