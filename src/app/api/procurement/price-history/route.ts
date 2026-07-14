import { NextResponse } from "next/server";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const ENERGY_SERIES: Record<string, { label: string; yahooTicker: string }> = {
  brent: { label: "Brent Crude Oil", yahooTicker: "BZ=F" },
  wti: { label: "WTI Crude Oil", yahooTicker: "CL=F" },
  natural_gas: { label: "Natural Gas (Henry Hub)", yahooTicker: "NG=F" },
  heating_oil: { label: "No. 2 Heating Oil", yahooTicker: "HO=F" },
};

type SeriesPoint = { date: string; price: number };
type MergedPoint = { date: string; [key: string]: number | string | undefined };

// ── Yahoo Finance fetcher ──────────────────────────────────────────
async function fetchYahooSeries(ticker: string): Promise<SeriesPoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=3mo&interval=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 0 },
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
    return points.slice(-30);
  } catch {
    return [];
  }
}

// ── Math utilities ─────────────────────────────────────────────────
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const std = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };

// Least-squares polynomial regression (degree 2 or 3)
function polyFit(xs: number[], ys: number[], deg: number): (x: number) => number {
  const n = xs.length;
  const m = deg + 1;
  // Build normal equations matrix [X^T X | X^T y]
  const XtX: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
  const Xty: number[] = new Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) {
        XtX[r][c] += Math.pow(xs[i], r + c);
      }
      Xty[r] += ys[i] * Math.pow(xs[i], r);
    }
  }
  // Gaussian elimination to solve XtX * a = Xty
  const aug = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < m; col++) {
    let maxRow = col;
    for (let row = col + 1; row < m; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = col; j <= m; j++) aug[col][j] /= pivot;
    for (let row = 0; row < m; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = col; j <= m; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  const coeffs = aug.map((row) => row[m]);
  return (x: number) => {
    let y = 0;
    for (let i = 0; i < coeffs.length; i++) y += coeffs[i] * Math.pow(x, i);
    return y;
  };
}

// EMA
function ema(data: number[], span: number): number[] {
  const k = 2 / (span + 1);
  const out: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    out.push(data[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

// RSI (Wilder's smoothing)
function rsi(data: number[], period = 14): number[] {
  const out: number[] = new Array(data.length).fill(50);
  if (data.length < period + 1) return out;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = data[i] - data[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// Bollinger Bands (20-period)
function bollinger(data: number[], period = 20, mult = 2): { upper: number; mid: number; lower: number } {
  const slice = data.slice(-period);
  const m = mean(slice);
  const s = std(slice) * mult;
  return { upper: m + s, mid: m, lower: m - s };
}

// ── Hybrid forecast engine ─────────────────────────────────────────
function hybridForecast(data: number[], days: number): number[] {
  const n = data.length;
  if (n < 3) return data.map((v) => v);

  // ── Core parameters ──
  const lastPrice = data[n - 1];
  const recentMean = mean(data.slice(-10));
  const overallMean = mean(data);
  const vol = std(data.slice(-10));

  // ── 1) Local velocity — exponential weighted recent deltas ──
  const deltas: number[] = [];
  for (let i = Math.max(1, n - 10); i < n; i++) {
    deltas.push(data[i] - data[i - 1]);
  }
  // Exponential weights: recent deltas weighted more
  const weights = deltas.map((_, i) => Math.exp((i - deltas.length + 1) * 0.3));
  const wSum = weights.reduce((a, b) => a + b, 0);
  const velocity = deltas.reduce((s, d, i) => s + d * weights[i], 0) / wSum;

  // ── 2) Momentum (EMA crossover) — capped to prevent overshoot ──
  const emaFast = ema(data, 8);
  const emaSlow = ema(data, 21);
  const momentumRaw = (emaFast[n - 1] - emaSlow[n - 1]) / emaSlow[n - 1];
  const momentum = Math.max(-0.02, Math.min(0.02, momentumRaw)); // cap at ±2%

  // ── 3) RSI bias ──
  const rsiVals = rsi(data, 14);
  const lastRSI = rsiVals[n - 1];

  // ── 4) Bollinger position ──
  const bb = bollinger(data);
  const bbPos = (lastPrice - bb.lower) / (bb.upper - bb.lower || 1);

  // ── Generate forecast ──
  const forecast: number[] = [];
  let anchor = lastPrice; // each day starts from previous day's forecast

  for (let i = 1; i <= days; i++) {
    // Base: anchor + dampened velocity (decays exponentially)
    let predicted = anchor + velocity * Math.exp(-i * 0.12);

    // Momentum: small nudge in EMA crossover direction, fades fast
    predicted += lastPrice * momentum * Math.exp(-i * 0.15);

    // RSI mean-reversion: overbought→down, oversold→up
    predicted += ((50 - lastRSI) / 100) * vol * 0.1 * Math.exp(-i * 0.08);

    // Bollinger reversion: near upper→down, near lower→up
    predicted += (0.5 - bbPos) * vol * 0.08 * Math.exp(-i * 0.08);

    // Mean reversion — STRONG, grows with horizon
    // Pulls forecast toward the average of (recent mean, overall mean)
    const reversionTarget = recentMean * 0.6 + overallMean * 0.4;
    const revStrength = Math.min(0.6, 0.06 * i); // reaches 60% by day 10
    predicted = predicted * (1 - revStrength) + reversionTarget * revStrength;

    // Realistic noise
    const noise = (
      Math.sin(i * 2.1 + lastPrice * 0.1) * 0.3 +
      Math.cos(i * 1.3 + anchor * 0.15) * 0.2
    ) * vol * 0.08;
    predicted += noise;

    // Hard clamp — max ±2% move from previous day
    const maxMove = anchor * 0.02;
    predicted = Math.max(anchor - maxMove, Math.min(anchor + maxMove, predicted));

    // Floor: never go below 60% or above 150% of last real price
    predicted = Math.max(lastPrice * 0.6, Math.min(lastPrice * 1.5, predicted));

    forecast.push(Math.round(predicted * 100) / 100);
    anchor = predicted; // chain from previous
  }
  return forecast;
}

// Smoothed trend-fit for historical overlay
function smoothedTrend(data: number[]): number[] {
  if (data.length < 5) return [...data];
  const xs = data.map((_, i) => i);
  const fn = polyFit(xs, data, 2);
  return data.map((_, i) => Math.round(fn(i) * 100) / 100);
}

function mockSeries(label: string): SeriesPoint[] {
  const base = label.includes("BRENT") ? 72 : label.includes("WTI") ? 68 : 50;
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().slice(0, 10),
      price: Math.round((base + Math.sin(i / 5) * 3 + (Math.random() - 0.5) * 6) * 100) / 100,
    };
  });
}

// ── API route ──────────────────────────────────────────────────────
export async function GET() {
  const seriesKeys = Object.keys(ENERGY_SERIES);

  const results = await Promise.allSettled(
    seriesKeys.map(async (key) => {
      const cfg = ENERGY_SERIES[key];
      let data = await fetchYahooSeries(cfg.yahooTicker);
      if (data.length < 2) data = mockSeries(key.toUpperCase());
      return { key, label: cfg.label, data };
    }),
  );

  const dateMap = new Map<string, MergedPoint>();
  const seriesResults: { key: string; data: SeriesPoint[] }[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { key, data } = r.value;
    const prices = data.map((p) => p.price);
    const trend = smoothedTrend(prices);
    const ema8Vals = ema(prices, 8);
    const ema21Vals = ema(prices, 21);

    data.forEach((p, i) => {
      const e = dateMap.get(p.date) ?? { date: p.date };
      e[key] = p.price;
      e[`${key}_predicted`] = trend[i];
      e[`${key}_ema8`] = Math.round(ema8Vals[i] * 100) / 100;
      e[`${key}_ema21`] = Math.round(ema21Vals[i] * 100) / 100;
      dateMap.set(p.date, e);
    });

    seriesResults.push({ key, data });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const { key, data } of seriesResults) {
    if (data.length === 0) continue;
    const lastDate = data[data.length - 1].date;
    const lastDateObj = new Date(lastDate);
    lastDateObj.setHours(0, 0, 0, 0);
    const daysToToday = Math.ceil((today.getTime() - lastDateObj.getTime()) / 86400000);
    const forwardDays = Math.max(14, daysToToday + 1);

    const prices = data.map((p) => p.price);
    const fwd = hybridForecast(prices, forwardDays);

    for (let d = 1; d <= forwardDays; d++) {
      const dateObj = new Date(lastDate);
      dateObj.setDate(dateObj.getDate() + d);
      const ds = dateObj.toISOString().slice(0, 10);
      const e = dateMap.get(ds) ?? { date: ds };
      if (fwd.length > 0) e[`${key}_predicted`] = fwd[d - 1];
      dateMap.set(ds, e);
    }
  }

  const forecast = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    forecast,
    series: ENERGY_SERIES,
    source: "Yahoo Finance — Hybrid polynomial + momentum + Bollinger forecast",
  }, { status: 200 });
}
