import { NextResponse } from "next/server";

const EIA_API_KEY = process.env.EIA_API_KEY;

const ENERGY_PRICE_SERIES: Record<string, { label: string; eiaId: string }> = {
  brent: { label: "Brent Crude Oil", eiaId: "RBRTE" },
  wti: { label: "WTI Crude Oil", eiaId: "RWTC" },
};

type PricePoint = { value: number; asOf: string; changePct: number | null };

async function fetchEiaSeries(series: string): Promise<PricePoint | null> {
  if (!EIA_API_KEY) {
    console.error("Missing EIA_API_KEY");
    return null;
  }
  
  try {
    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=${series}&sort[0][column]=period&sort[0][direction]=desc&length=2`;
    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`EIA request failed for ${series}: ${res.status} — ${errorBody}`);
      return null;
    }
    const json = await res.json();
    const rows: { period: string; value: number }[] = json.response?.data ?? [];
    if (rows.length === 0) return null;

    const latest = rows[0];
    const prev = rows[1];
    const latestValue = Number(latest.value);
    const prevValue = prev ? Number(prev.value) : null;
    const changePct =
      prevValue && prevValue !== 0 ? ((latestValue - prevValue) / prevValue) * 100 : null;

    return { value: latestValue, asOf: latest.period, changePct };
  } catch (err) {
    console.error(`EIA fetch error for ${series} (network/connectivity issue):`, err);
    return null;
  }
}

export async function GET() {
  const entries = await Promise.all(
    Object.entries(ENERGY_PRICE_SERIES).map(async ([key, config]) => {
      const point = await fetchEiaSeries(config.eiaId);
      return [key, point] as const;
    }),
  );
  
  const prices = Object.fromEntries(entries);
  return NextResponse.json({ prices }, { status: 200 });
}
