/**
 * Route Geometry — shipping lane waypoints for the Scenario Simulator SVG map.
 *
 * Projection used by ScenarioMap:
 *   SVG viewBox: 0 0 1000 500
 *   Longitude span: -20 → 145  (165° → 1000px)
 *   Latitude span:  50 → -45   (95° → 500px, north=top)
 *
 * All coordinates are [longitude, latitude] in decimal degrees.
 * Waypoints trace the primary India-bound shipping lane for each corridor.
 */

export type LonLat = [number, number];

// ─── Projection ───────────────────────────────────────────────────────────────

export const MAP_BOUNDS = {
  lonMin: -20,
  lonMax: 145,
  latMax: 50,
  latMin: -45,
  svgW: 1000,
  svgH: 500,
} as const;

export function project([lon, lat]: LonLat): [number, number] {
  const { lonMin, lonMax, latMax, latMin, svgW, svgH } = MAP_BOUNDS;
  const x = ((lon - lonMin) / (lonMax - lonMin)) * svgW;
  const y = ((latMax - lat) / (latMax - latMin)) * svgH;
  return [x, y];
}

export function toSvgD(waypoints: LonLat[]): string {
  return waypoints
    .map((pt, i) => {
      const [x, y] = project(pt);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ─── Corridor route waypoints ─────────────────────────────────────────────────
// Each route traces the shipping lane from its origin toward Indian ports.

export const CORRIDOR_ROUTES: Record<string, LonLat[]> = {
  // Persian Gulf → Strait of Hormuz → Arabian Sea → West India
  corridor_hormuz: [
    [56, 26], [56.3, 26.6], [58, 24], [60, 21], [64, 18],
    [67, 18], [70, 18], [72, 19],
  ],

  // Red Sea → Bab-el-Mandeb → Arabian Sea → West India
  corridor_bab_el_mandeb: [
    [37, 22], [43.4, 12.6], [47, 12], [52, 12],
    [59, 13], [64, 14], [68, 18], [72, 19],
  ],

  // Mediterranean → Suez Canal → Red Sea → Bab-el-Mandeb → West India
  corridor_suez: [
    [25, 35], [32.3, 30.6], [34, 27], [37, 22],
    [43.4, 12.6], [47, 12], [59, 13], [68, 18], [72, 19],
  ],

  // Singapore / Malacca Strait → Bay of Bengal → East India
  corridor_malacca: [
    [103, 1.5], [100.9, 2.8], [97, 5], [92, 8],
    [87, 12], [83, 13], [80.3, 13.1],
  ],

  // South China Sea → Malacca → Bay of Bengal → East India
  corridor_south_china_sea: [
    [115, 15], [112.5, 12], [107, 5], [103, 2],
    [100.9, 2.8], [97, 5], [90, 10], [83, 13], [80.3, 13.1],
  ],

  // Cape of Good Hope → Indian Ocean → West India
  corridor_cape_good_hope: [
    [15, -35], [18.5, -34.4], [30, -35], [45, -28],
    [58, -20], [65, -10], [67, 3], [68, 12], [68, 18], [72, 19],
  ],

  // Black Sea → Bosphorus → Mediterranean → Suez → Red Sea → India
  corridor_black_sea: [
    [34, 43], [32, 40], [29, 37], [25, 35],
    [32.3, 30.6], [34, 27], [37, 22], [43.4, 12.6],
    [47, 12], [59, 13], [68, 18], [72, 19],
  ],
};

// ─── Alternate routes (for supplier-switch / spot-charter lever overlays) ─────

/** Supplier country → which corridor their shipments travel to reach India */
export const SUPPLIER_CORRIDOR: Record<string, string> = {
  saudi_arabia: "corridor_hormuz",
  iraq:         "corridor_hormuz",
  uae:          "corridor_hormuz",
  russia:       "corridor_cape_good_hope",
  usa:          "corridor_cape_good_hope",
  brazil:       "corridor_cape_good_hope",
  nigeria:      "corridor_cape_good_hope",
};

// ─── Indian port coordinates ───────────────────────────────────────────────────

export const INDIA_PORTS: { id: string; label: string; coords: LonLat }[] = [
  { id: "port_mundra",     label: "Mundra",   coords: [69.7, 22.8] },
  { id: "port_jnpt",       label: "JNPT",     coords: [72.9, 18.9] },
  { id: "port_kandla",     label: "Kandla",   coords: [70.2, 23.0] },
  { id: "port_kochi",      label: "Kochi",    coords: [76.3, 10.0] },
  { id: "port_chennai",    label: "Chennai",  coords: [80.3, 13.1] },
  { id: "port_vizag",      label: "Vizag",    coords: [83.3, 17.7] },
  { id: "port_mangalore",  label: "Mangalore",coords: [74.9, 12.9] },
];

// ─── Simplified land-mass polygons ─────────────────────────────────────────────
// Rough outlines for stylized map — not geodetically accurate.

export const LAND_MASSES: {
  id: string;
  points: LonLat[];
  label?: string;
  labelAt?: LonLat;
}[] = [
  {
    id: "arabian_peninsula",
    label: "MIDDLE EAST",
    labelAt: [46, 25],
    points: [
      [32, 29], [36, 30], [43, 30], [48, 30], [53, 28],
      [58, 23], [60, 22], [58, 20], [55, 16], [52, 14],
      [44, 13], [43, 14], [38, 22], [34, 26], [32, 29],
    ],
  },
  {
    id: "india",
    label: "INDIA",
    labelAt: [79, 22],
    points: [
      [64, 24], [68, 24], [72, 23], [74, 22], [77, 21],
      [80, 16], [77, 10], [78, 8], [80, 7.5], [84, 10],
      [87, 20], [89, 22], [92, 26], [88, 28], [84, 29],
      [79, 32], [74, 33], [70, 33], [66, 30], [63, 27], [64, 24],
    ],
  },
  {
    id: "east_africa",
    label: "EAST AFRICA",
    labelAt: [37, 3],
    points: [
      [30, -2], [34, 2], [41, 4], [44, 11], [43, 14],
      [38, 22], [34, 26], [33, 30], [26, 30], [26, -2], [30, -2],
    ],
  },
  {
    id: "southeast_asia",
    label: "SE ASIA",
    labelAt: [108, 14],
    points: [
      [97, 5], [100, 7], [103, 1.5], [104, 3],
      [105, 7], [101, 7.5], [97, 7], [97, 5],
    ],
  },
  {
    id: "southern_africa",
    label: "",
    labelAt: [26, -28],
    points: [
      [17, -29], [20, -34], [24, -34], [29, -33],
      [33, -28], [36, -20], [36, -12], [33, -9],
      [29, -7], [25, -14], [20, -22], [17, -27], [17, -29],
    ],
  },
  {
    id: "egypt_levant",
    label: "",
    labelAt: [35, 28],
    points: [
      [25, 36], [30, 36], [35, 31], [36, 29], [34, 26],
      [33, 24], [32, 22], [30, 22], [29, 24], [25, 30], [25, 36],
    ],
  },
];

// ─── Region text labels ───────────────────────────────────────────────────────

export const REGION_LABELS: { label: string; at: LonLat }[] = [
  { label: "ARABIAN SEA",     at: [63, 16] },
  { label: "BAY OF BENGAL",   at: [87, 15] },
  { label: "INDIAN OCEAN",    at: [75, 0]  },
  { label: "RED SEA",         at: [38, 18] },
  { label: "PERSIAN GULF",    at: [52, 26] },
];
