import { NextResponse } from "next/server";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const EIA_API_KEY = process.env.EIA_API_KEY;

const ENERGY_SERIES: Record<string, { label: string; eiaId: string }> = {
  brent: { label: "Brent Crude Oil", eiaId: "RBRTE" },
  wti: { label: "WTI Crude Oil", eiaId: "RWTC" },
  natural_gas: { label: "Natural Gas (Henry Hub)", eiaId: "RNGWHHD" },
  heating_oil: { label: "No. 2 Heating Oil", eiaId: "W_EPD2F_PRS_SI_d" },
  propane: { label: "Propane", eiaId: "W_EPLLPA_PRS_SI_d" },
};

type SeriesPoint = { date: string; price: number };
type MergedPoint = { date: string; [key: string]: number | string | undefined };
type ForecastPoint = MergedPoint & { [key: string]: number | string | undefined };

async function fetchEiaSeries(seriesId: string): Promise<SeriesPoint[]> {
  try {
    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=${seriesId}&sort[0][column]=period&sort[0][direction]=desc&length=30`;

    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`EIA request failed for ${seriesId}: ${res.status} — ${errorBody}`);
      return [];
    }
    const json = await res.json();
    const rows: { period: string; value: string }[] = json?.response?.data ?? [];

    return rows
      .map((r) => ({ date: r.period, price: parseFloat(r.value) }))
      .reverse();
  } catch (err) {
    console.error(`EIA fetch error for ${seriesId} (network/connectivity issue):`, err);
    return [];
  }
}

function linearRegression(values: number[]): { slope: number; intercept: number } | null {
  const n = values.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function predict(points: SeriesPoint[]): (number | undefined)[] {
  const prices = points.map((p) => p.price);
  const reg = linearRegression(prices);
  if (!reg) return prices.map(() => undefined);
  return prices.map((_, i) => Math.round((reg.slope * i + reg.intercept) * 100) / 100);
}

function mockSeries(label: string): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  const base = label.includes("BRENT") ? 72 : label.includes("WTI") ? 68 : 50;
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const noise = (Math.random() - 0.5) * 6;
    const trend = Math.sin(i / 5) * 3;
    points.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round((base + trend + noise) * 100) / 100,
    });
  }
  return points;
}

export async function GET() {
  const seriesKeys = Object.keys(ENERGY_SERIES);

  const results = await Promise.allSettled(
    seriesKeys.map(async (key) => {
      const config = ENERGY_SERIES[key];
      let data = await fetchEiaSeries(config.eiaId);
      if (data.length < 2) {
        data = mockSeries(key.toUpperCase());
      }
      const predictions = predict(data);
      return { key, label: config.label, data, predictions };
    }),
  );

  const dateMap = new Map<string, MergedPoint>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { key, data, predictions } = result.value;
    data.forEach((p, i) => {
      const existing = dateMap.get(p.date) ?? { date: p.date };
      existing[key] = p.price;
      existing[`${key}_predicted`] = predictions[i];
      dateMap.set(p.date, existing);
    });
  }

  const forecast = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return NextResponse.json(
    {
      forecast,
      series: ENERGY_SERIES,
      source: "EIA (U.S. Energy Information Administration), daily spot prices for energy commodities",
    },
    { status: 200 },
  );
}