import { NextResponse } from "next/server";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

type PricePoint = { value: number; asOf: string };

const SERIES = {
  brent: "BZ=F",
  wti: "CL=F",
};

async function fetchYahooPrice(ticker: string): Promise<PricePoint | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1mo&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`Yahoo request failed for ${ticker}: ${res.status}`);
      return null;
    }
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    
    // Find the most recent valid close price
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (closes[i] != null) {
        return {
          value: Math.round(closes[i]! * 100) / 100,
          asOf: new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
        };
      }
    }
    return null;
  } catch (err) {
    console.error(`Yahoo fetch error for ${ticker}:`, err);
    return null;
  }
}

export async function GET() {
  const [brent, wti] = await Promise.all([
    fetchYahooPrice(SERIES.brent),
    fetchYahooPrice(SERIES.wti),
  ]);
  
  return NextResponse.json({ prices: { brent, wti } }, { status: 200 });
}
