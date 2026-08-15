// Maritime chokepoint routing utilities — ported from carbon-evolution/horus.
// Maps country names to geographic regions and sea lanes to chokepoints transited.

type Region = "EA" | "SEA" | "SA" | "GULF" | "MED" | "EU" | "NA" | "SAM_P" | "SAM_A" | "AFR" | "OCE" | "RU" | "?";

const REGION: Record<string, Region> = {
  China: "EA", "Hong Kong": "EA", "South Korea": "EA", Taiwan: "EA", Japan: "EA",
  Vietnam: "SEA", Malaysia: "SEA", Indonesia: "SEA", Singapore: "SEA", Thailand: "SEA", Philippines: "SEA",
  India: "SA", Bangladesh: "SA",
  UAE: "GULF", "Saudi Arabia": "GULF", Qatar: "GULF", Iran: "GULF", Kuwait: "GULF", Bahrain: "GULF", Iraq: "GULF",
  Israel: "MED", Turkey: "MED", Egypt: "MED",
  Netherlands: "EU", Germany: "EU", UK: "EU", Ireland: "EU", France: "EU", Sweden: "EU",
  Poland: "EU", Hungary: "EU", Italy: "EU", Spain: "EU", Finland: "EU", Belgium: "EU", Russia: "RU",
  USA: "NA", Canada: "NA", Mexico: "NA",
  Chile: "SAM_P", Peru: "SAM_P", Colombia: "SAM_P",
  Brazil: "SAM_A", Argentina: "SAM_A",
  "DR Congo": "AFR", "South Africa": "AFR", Morocco: "AFR", Nigeria: "AFR",
  Mozambique: "AFR", Madagascar: "AFR", Gabon: "AFR",
  Oceania: "OCE", Australia: "OCE", "New Zealand": "OCE",
  Myanmar: "SEA",
};

const WEST_OF_MALACCA: Region[] = ["EU", "MED", "GULF", "SA", "AFR"];

export function regionOf(country: string): Region {
  return REGION[country] ?? "?";
}

export function chokepointsForLane(origin: string, dest: string): string[] {
  const a = regionOf(origin), b = regionOf(dest);
  if (a === "?" || b === "?" || (a === b && origin !== "Taiwan" && dest !== "Taiwan")) {
    const cps = new Set<string>();
    if (origin === "Taiwan" || dest === "Taiwan") cps.add("Taiwan Strait");
    return [...cps];
  }
  const set = new Set<Region>([a, b]);
  const has = (r: Region) => set.has(r);
  const between = (g1: Region[], g2: Region[]) =>
    (g1.includes(a) && g2.includes(b)) || (g1.includes(b) && g2.includes(a));

  const cps = new Set<string>();
  if (has("GULF")) cps.add("Strait of Hormuz");
  if (between(["EU", "MED"], ["EA", "SEA", "SA", "GULF"])) cps.add("Suez Canal");
  if (between(WEST_OF_MALACCA, ["EA", "SEA"])) cps.add("Strait of Malacca");
  if (has("EA") && between(["EA"], ["SEA", "SA", "EU", "MED", "GULF", "AFR", "OCE"])) {
    cps.add("South China Sea");
  }
  if (origin === "Taiwan" || dest === "Taiwan" || between(["EA"], ["NA", "SAM_P", "OCE"])) {
    cps.add("Taiwan Strait");
  }
  if (between(["SAM_A"], ["EA", "SEA", "SAM_P", "NA", "OCE"])) cps.add("Panama Canal");
  return [...cps];
}

export function volumeToBillions(volume: string): number {
  const n = parseFloat(volume.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return /B/i.test(volume) ? n : /M/i.test(volume) ? n / 1000 : n;
}

export const CHOKEPOINT_COORD: Record<string, [number, number]> = {
  "Strait of Malacca": [2.5, 101.3],
  "Strait of Hormuz": [26.6, 56.3],
  "Suez Canal": [30.5, 32.3],
  "Bab-el-Mandeb": [12.6, 43.4],
  "Panama Canal": [9.1, -79.7],
  "Taiwan Strait": [24.5, 119.6],
  "South China Sea": [13.0, 114.0],
};

export const SEA_VIA: Record<string, [number, number][]> = {
  "Strait of Malacca>Suez Canal": [[6, 80], [13, 62], [12.5, 45], [20, 38]],
  "Suez Canal>Netherlands": [[33.5, 24], [37, 11], [36, -6], [38, -10], [43, -10], [48, -6], [50, -1.5], [51.5, 3]],
  "Suez Canal>Germany": [[33.5, 24], [37, 11], [36, -6], [38, -10], [43, -10], [48, -6], [50, -1.5], [52, 3.5]],
  "India>Strait of Malacca": [[13, 73], [8, 75], [5, 79], [6, 90], [7, 97]],
  "South China Sea>Strait of Malacca": [[2, 105]],
  "South China Sea>Taiwan Strait": [[18, 117]],
  "Australia>South China Sea": [[-8.5, 116], [0, 118], [8, 115]],
  "Australia>Strait of Malacca": [[-10, 114], [-2, 106]],
  "Chile>Taiwan Strait": [[-22, -150], [5, 170]],
  "USA>Taiwan Strait": [[30, -160], [22, 175]],
  "South Africa>Strait of Malacca": [[-27, 45], [-10, 70], [0, 92]],
  
  // Custom Energy Lanes to prevent crossing land:
  "Saudi Arabia>India": [[22, 60], [18, 68]],
  "Iraq>India": [[28, 50], [24, 58], [19, 68]],
  "UAE>India": [[24, 58], [19, 68]],
  "Qatar>India": [[25, 53], [24, 58], [19, 68]],
  "Kuwait>India": [[28, 50], [24, 58], [19, 68]],
  "Russia>India": [[60, 5], [50, -10], [10, -20], [-35, 15], [-35, 40], [-10, 55], [5, 65]],
  "USA>India": [[30, -70], [10, -40], [-35, 15], [-35, 40], [-10, 55], [5, 65]],
  "Nigeria>India": [[2, 5], [-35, 15], [-35, 40], [-10, 55], [5, 65]],
  
  "Saudi Arabia>Strait of Malacca": [[22, 60], [12, 65], [6, 75], [6, 90]],
  "Iraq>Strait of Malacca": [[28, 50], [24, 58], [12, 65], [6, 75], [6, 90]],
  "UAE>Strait of Malacca": [[24, 58], [12, 65], [6, 75], [6, 90]],
  "Qatar>Strait of Malacca": [[25, 53], [24, 58], [12, 65], [6, 75], [6, 90]],
  "Russia>Strait of Malacca": [[60, 5], [50, -10], [10, -20], [-35, 15], [-35, 40], [-10, 75], [0, 92]],
};

export function seaVia(a: string, b: string): [number, number][] {
  const f = SEA_VIA[`${a}>${b}`];
  if (f) return f;
  const r = SEA_VIA[`${b}>${a}`];
  return r ? [...r].reverse() : [];
}

export const COUNTRY_COORD: Record<string, [number, number]> = {
  China: [31.2, 121.5],
  Taiwan: [24.8, 120.9],
  "South Korea": [35.1, 129.0],
  Japan: [35.4, 139.7],
  Vietnam: [10.8, 106.7],
  Malaysia: [3.0, 101.4],
  Indonesia: [-6.1, 106.8],
  Singapore: [1.3, 103.8],
  India: [19.0, 72.9],
  UAE: [25.0, 55.1],
  "Saudi Arabia": [24.0, 50.1],
  Iraq: [29.5, 47.8],
  Iran: [27.0, 56.0],
  Qatar: [25.3, 51.5],
  Kuwait: [29.4, 47.9],
  Russia: [43.1, 131.9],
  USA: [34.0, -118.2],
  Netherlands: [51.9, 4.5],
  Germany: [53.5, 9.9],
  UK: [51.5, 0.1],
  France: [43.3, 5.4],
  Australia: [-20.3, 118.6],
  Nigeria: [6.5, 3.4],
  Morocco: [33.6, -7.6],
  Egypt: [31.2, 29.9],
};
