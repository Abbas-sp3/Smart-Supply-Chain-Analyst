import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CommodityItem = {
  exchange: string;
  name: string;
  value: string;
  category: string;
  price: string;
  updated: number;
  currency_unit: string;
  unit: string;
  change: string;
  isPositive: boolean;
  history: number[];
};

let cached: { data: CommodityItem[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const YAHOO_SYMBOLS: { symbol: string; value: string; name: string; unit: string }[] = [
  { symbol: "BZ=F",  value: "brent_crude_oil", name: "Brent Crude",  unit: "$/bbl"  },
  { symbol: "CL=F",  value: "wti_crude_oil",   name: "WTI Crude",    unit: "$/bbl"  },
  { symbol: "NG=F",  value: "natural_gas",     name: "Natural Gas",  unit: "$/MMBtu" },
  { symbol: "MTF=F", value: "coal",            name: "Coal (API2)",  unit: "$/mt"   },
  { symbol: "HO=F",  value: "heating_oil",     name: "Heating Oil",  unit: "$/gal"  },
  { symbol: "RB=F",  value: "gasoline_rbob",   name: "Gasoline RBOB",unit: "$/gal"  },
];

async function fetchYahooChart(symbol: string): Promise<{
  price: number;
  prevClose: number;
  history: number[];
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=14d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    // Filter nulls, take last 7 valid closes for sparkline
    const validCloses = closes.filter((v: number | null) => v != null && v > 0);
    const history = validCloses.slice(-7);

    return {
      price: meta.regularMarketPrice ?? 0,
      prevClose: meta.chartPreviousClose ?? meta.previousClose ?? 0,
      history,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("force") === "true";
  if (force) cached = null;

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { commodities: cached.data, fetched_at: new Date().toISOString(), cached: true, source: "yahoo_finance" },
      { status: 200 },
    );
  }

  const results = await Promise.allSettled(
    YAHOO_SYMBOLS.map(async ({ symbol, value, name, unit }) => {
      const data = await fetchYahooChart(symbol);
      if (!data || data.price === 0) return null;

      const priceDiff = data.price - data.prevClose;
      const changePct = data.prevClose > 0 ? (priceDiff / data.prevClose) * 100 : 0;
      const isPositive = changePct >= 0;
      const changeStr = `${isPositive ? "+" : ""}${changePct.toFixed(1)}%`;

      // Ensure history ends with current price for a clean sparkline
      const history = data.history.length > 0
        ? [...data.history.slice(0, -1), data.price]
        : [data.price];

      return {
        exchange: "Yahoo Finance",
        name,
        value,
        category: "energy",
        price: data.price.toFixed(2),
        updated: Date.now(),
        currency_unit: "USD",
        unit,
        change: changeStr,
        isPositive,
        history,
      } satisfies CommodityItem;
    }),
  );

  const commodities = results
    .filter((r): r is PromiseFulfilledResult<CommodityItem> =>
      r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);

  if (commodities.length > 0) {
    cached = { data: commodities, fetchedAt: Date.now() };
  }

  return NextResponse.json(
    { commodities, fetched_at: new Date().toISOString(), source: "yahoo_finance" },
    { status: 200 },
  );
}
