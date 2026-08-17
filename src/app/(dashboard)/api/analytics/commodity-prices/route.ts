import { NextResponse } from "next/server";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const ENERGY_SERIES: Record<string, { label: string; yahooTicker: string }> = {
  brent: { label: "Brent Crude Oil", yahooTicker: "BZ=F" },
  wti: { label: "WTI Crude Oil", yahooTicker: "CL=F" },
};

type SeriesPoint = { date: string; price: number };
type MergedPoint = { date: string; [key: string]: number | string | undefined };

async function fetchYahooSeries(ticker: string): Promise<SeriesPoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=90d&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    const points: SeriesPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null) continue;
      points.push({
        date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
        price: Math.round(closes[i]! * 100) / 100,
      });
    }
    return points;
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [brentData, wtiData] = await Promise.all([
      fetchYahooSeries(ENERGY_SERIES.brent.yahooTicker),
      fetchYahooSeries(ENERGY_SERIES.wti.yahooTicker),
    ]);

    // Merge data by date
    const mergedMap = new Map<string, MergedPoint>();
    
    brentData.forEach(p => {
      mergedMap.set(p.date, { date: p.date, brent: p.price });
    });
    
    wtiData.forEach(p => {
      const existing = mergedMap.get(p.date) || { date: p.date };
      existing.wti = p.price;
      mergedMap.set(p.date, existing);
    });

    const mergedSeries = Array.from(mergedMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      series: mergedSeries,
      source: "Yahoo Finance (Daily Close)",
    });
  } catch (error) {
    console.error("Commodity prices API error:", error);
    return NextResponse.json({ error: "Failed to fetch commodity prices" }, { status: 500 });
  }
}
