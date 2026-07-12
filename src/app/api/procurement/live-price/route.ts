import { NextResponse } from "next/server";

const API_NINJAS_KEY = process.env.API_NINJAS_KEY;

type CommodityItem = {
  exchange: string;
  name: string;
  value: string;
  category: string;
  price: number;
  updated: number;
  currency_unit: string;
  unit: string;
};

let cached: { data: CommodityItem[]; fetchedAt: number } | null = null;
const CACHE_TTL = 15000;

export async function GET() {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { commodities: cached.data, fetched_at: new Date().toISOString(), cached: true },
      { status: 200 },
    );
  }

  try {
    const res = await fetch("https://api.api-ninjas.com/v1/commoditysnapshot", {
      headers: { "X-Api-Key": API_NINJAS_KEY as string },
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const allCommodities = (Array.isArray(data) ? data : []).map(normalizeItem);
      const commodities = allCommodities.filter((c) => c.category === "energy");
      if (commodities.length > 0) {
        cached = { data: commodities, fetchedAt: Date.now() };
        return NextResponse.json({ commodities, fetched_at: new Date().toISOString(), filtered: "energy_only" }, { status: 200 });
      }
    }
  } catch {
    // fall through
  }

  const tryList = [
    "crude_oil", "brent_crude_oil", "natural_gas",
    "heating_oil", "gasoline_rbob", "lng",
    "coal", "propane", "ethanol",
    "diesel", "jet_fuel", "uranium",
  ];

  const results = await Promise.allSettled(
    tryList.map(async (name) => {
      const res = await fetch(
        `https://api.api-ninjas.com/v1/commodityprice?name=${name}`,
        { headers: { "X-Api-Key": API_NINJAS_KEY as string }, next: { revalidate: 0 } },
      );
      if (!res.ok) return null;
      const json = await res.json();
      return {
        exchange: json.exchange ?? "Unknown",
        name: json.name ?? name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: name,
        category: "energy",
        price: typeof json.price === "number" ? json.price : 0,
        updated: json.updated ?? 0,
        currency_unit: json.currency_unit ?? "USD",
        unit: json.unit ?? "",
      };
    }),
  );

  const commodities = results
    .filter((r): r is PromiseFulfilledResult<CommodityItem> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);

  cached = { data: commodities, fetchedAt: Date.now() };

  return NextResponse.json(
    { commodities, fetched_at: new Date().toISOString(), fallback: true, filtered: "energy_only" },
    { status: 200 },
  );
}

function getCategory(value: string): string {
  if (["crude_oil", "brent_crude_oil", "natural_gas", "heating_oil", "gasoline_rbob", "lng", "coal", "propane", "ethanol", "diesel", "jet_fuel", "uranium"].includes(value)) return "energy";
  return "energy";
}

function normalizeItem(raw: any): CommodityItem {
  return {
    exchange: raw.exchange ?? "Unknown",
    name: raw.name ?? raw.value ?? "Unknown",
    value: raw.value ?? "",
    category: raw.category ?? getCategory(raw.value ?? ""),
    price: typeof raw.price === "number" ? raw.price : 0,
    updated: raw.updated ?? 0,
    currency_unit: raw.currency_unit ?? "USD",
    unit: raw.unit ?? "",
  };
}
