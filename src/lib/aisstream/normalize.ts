import type { Ship } from "@/types/ship";

export type AisEnvelope = {
  MessageType?: string;
  MetaData?: {
    MMSI?: number;
    ShipName?: string;
    latitude?: number;
    longitude?: number;
    time_utc?: string;
  };
  Message?: Record<string, Record<string, unknown>>;
  error?: string;
};

export type VesselCacheEntry = Partial<Ship> & {
  mmsi: string;
  updatedAt: number;
};

export function resolveShipType(typeCode: unknown): string {
  const code = typeof typeCode === "number" ? typeCode : Number(typeCode);

  if (Number.isNaN(code)) {
    return "Unknown";
  }

  if (code >= 80 && code <= 89) {
    return "Tanker";
  }

  if (code >= 70 && code <= 79) {
    return "Cargo";
  }

  if (code >= 60 && code <= 69) {
    return "Passenger";
  }

  if (code >= 30 && code <= 39) {
    return "Fishing";
  }

  if (code >= 50 && code <= 59) {
    return "Special";
  }

  return "Vessel";
}

export function resolveCountryFromMmsi(mmsi: string): string {
  const mid = mmsi.slice(0, 3);
  const midMap: Record<string, string> = {
    "419": "India",
    "405": "India",
    "406": "India",
    "408": "India",
    "411": "India",
    "412": "China",
    "413": "China",
    "414": "China",
    "416": "China",
    "431": "Japan",
    "432": "Japan",
    "434": "Japan",
    "436": "Japan",
    "438": "Japan",
    "440": "Korea",
    "441": "Korea",
    "470": "UAE",
    "471": "UAE",
    "472": "UAE",
    "473": "UAE",
    "477": "Hong Kong",
    "503": "Australia",
    "538": "USA",
    "563": "Singapore",
    "566": "Singapore",
    "567": "Thailand",
    "636": "Liberia",
    "637": "Liberia",
    "638": "Liberia",
    "639": "Liberia",
    "244": "Netherlands",
    "245": "Netherlands",
    "246": "Netherlands",
    "247": "Italy",
    "248": "Malta",
    "249": "Malta",
    "257": "Norway",
    "259": "Norway",
    "351": "Panama",
    "352": "Panama",
    "353": "Panama",
    "354": "Panama",
    "355": "Panama",
    "356": "Panama",
    "357": "Panama",
    "358": "Panama",
    "359": "Panama",
  };

  return midMap[mid] ?? "";
}

export function sanitizeDestination(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/@+/g, "").trim();
}

export function sanitizeName(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

export function resolveHeading(trueHeading: unknown, cog: unknown) {
  const heading = Number(trueHeading);
  const course = Number(cog);

  if (!Number.isNaN(heading) && heading >= 0 && heading <= 360 && heading !== 511) {
    return heading;
  }

  if (!Number.isNaN(course) && course >= 0 && course <= 360) {
    return course;
  }

  return 0;
}
