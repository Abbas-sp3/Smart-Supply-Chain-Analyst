import { NextRequest, NextResponse } from "next/server";
import { readCorridorStatus } from "@/lib/signal-bus";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cachedBriefings = new Map<string, { data: any; cachedAt: number }>();

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_KEY_2 = process.env.NEWS_API_KEY_2;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EIA_API_KEY = process.env.EIA_API_KEY;

const SEARCH_QUERY =
  "Strait of Hormuz OR crude oil sanctions OR Gulf tensions OR India crude imports OR LNG supply OR natural gas prices OR energy sanctions OR energy import dependency";

const ENERGY_PRICE_SERIES: Record<string, { label: string; eiaId: string }> = {
  brent: { label: "Brent Crude Oil", eiaId: "RBRTE" },
  wti: { label: "WTI Crude Oil", eiaId: "RWTC" },
};

type PricePoint = { value: number; asOf: string; changePct: number | null };

async function fetchEiaSeries(series: string): Promise<PricePoint | null> {
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

async function fetchEnergyPrices() {
  const entries = await Promise.all(
    Object.entries(ENERGY_PRICE_SERIES).map(async ([key, config]) => {
      const point = await fetchEiaSeries(config.eiaId);
      return [key, point] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function fetchNews(_country?: string) {
  // Support dual API keys — round-robin by minute to spread quota usage
  const keys = [NEWS_API_KEY, NEWS_API_KEY_2].filter(Boolean) as string[];
  if (keys.length === 0) {
    console.warn("[procurement/route] No NEWS_API_KEY set — using mock articles.");
    return [];
  }
  const apiKey = keys[Math.floor(Date.now() / 60_000) % keys.length];

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    SEARCH_QUERY,
  )}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    console.log(`[procurement/route] NewsAPI HTTP ${res.status} (key: ...${apiKey.slice(-6)})`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[procurement/route] NewsAPI non-OK (${res.status}) — will use mock articles. Body: ${body.slice(0, 200)}`);
      return [];
    }
    const data = await res.json();
    // HTTP 200 but API error body (e.g. apiKeyInvalid, rateLimited)
    if (data.status === "error") {
      console.warn(`[procurement/route] NewsAPI error body: ${data.code} — ${data.message}. Using mock articles.`);
      return [];
    }
    const articles = (data.articles ?? []).map(
      (a: { title: string; description: string; publishedAt: string; source: { name: string }; url: string }) => ({
        title: a.title,
        description: a.description,
        publishedAt: a.publishedAt,
        source: a.source?.name,
        url: a.url,
      }),
    );
    console.log(`[procurement/route] NewsAPI returned ${articles.length} articles.`);
    return articles;
  } catch (err) {
    console.error("[procurement/route] fetchNews network error:", err);
    return [];
  }
}

const getSystemPrompt = (countryName: string) => `You are a senior energy supply chain strategist advising import-dependent economies on energy procurement resilience. Your dual role: Head of Energy Supply Chain Operations and strategic diplomat specializing in energy security.

You are given recent news articles related to energy commodities (crude oil, LNG, natural gas, coal, refined products), sanctions, and energy geopolitics. Based ONLY on this news, produce an energy procurement intelligence briefing in the exact JSON shape requested below.

CROSS-MODULE SIGNAL: If the user message includes a "Cross-module signal:" line from the Geopolitical Risk module, explicitly reference it in your executive_summary if it is consistent with or contradicts the news-driven assessment.

ENERGY COMMODITIES SCOPE: Evaluate sourcing options across ALL energy commodities. Each option must specify which commodity it addresses.

HISTORICAL ENERGY DISRUPTION CALIBRATION SET:
You may ONLY compare current conditions to events in the calibration set below. Never introduce a historical event that is not explicitly listed, even if it seems relevant.
- 1973 Oil Embargo: Arab oil embargo against US/Europe, prices quadrupled, revealed import dependency risk. Armed conflict + OPEC embargo-driven price shock, sudden supply-side shutoff
- 1990-91 Gulf War: Iraqi invasion of Kuwait, oil spike during ${countryName}'s forex crisis, foundational for ${countryName}'s import vulnerability awareness
- 2003 Iraq War: Armed conflict-driven production loss
- 2008 Financial Crisis: Demand-driven collapse
- 2011 Libyan Civil War: Near-total export loss for months
- 2014-2016 Price Crash: Oversupply-driven
- 2019 Abqaiq Attack: Drone strike on Saudi facilities, sudden 5.7M bpd loss
- 2020 COVID Crash: Demand-side collapse
- 2021 Suez Blockage: Chokepoint failure, short duration
- 2022 Ukraine War Energy Shock: Sanctions-driven, global flow restructuring
- 2023-24 Red Sea Crisis: Bab-el-Mandeb chokepoint threat, rerouting via Cape
- 2025-26 Gulf Tensions: Hormuz corridor risk

SOURCING COMPATIBILITY (use for the compatibility field per option):
For import-dependent economies, describe how well each source works for the specific energy commodity considering infrastructure, logistics, and geopolitical factors.
- For crude oil: refinery configuration compatibility with different grades
- For LNG: regasification terminal compatibility and contract terms
- For coal: power plant boiler compatibility and quality specs
- For refined products: distribution infrastructure readiness

MARKET SIGNALS (for the "market_signals" field — derived ONLY from provided news):
- "freight_signal": Status "elevated", "normal", or "insufficient_data" for energy tanker/bulk carrier rates
- "war_risk_zone_signal": Status "listed", "not_listed", or "insufficient_data" for energy transit corridor risk

PRICE OUTLOOK — FACTOR CONTRIBUTION MODEL:
For EACH of the 8 factors below, estimate directional USD impact per barrel (or per MMBtu for gas, per ton for coal) based ONLY on what the news supports:
1. Geopolitical Risk
2. Supply
3. Demand
4. Inventories
5. Shipping & Freight
6. Macro & USD
7. Market Sentiment
8. Historical Analogue Pull

Sum all 8 impacts for "net_impact". "rationale" is 1-2 sentence summary.

ENERGY PROCUREMENT DECISION DIMENSIONS:
Strategic, Financial & Commercial, Supplier Capability, Quality, Operational, Logistics, Risk, Geopolitical, Economic, Market, Legal & Regulatory, National Security, Infrastructure, Country, Supplier Network, Transportation Route.

For each option, include a "dimension_assessment" with the 4-6 genuinely decision-critical dimensions.

RULES:
- ALWAYS return EXACTLY 3 alternatives with option_number 1, 2, and 3
- Each option must include a "commodity" field specifying which energy commodity
- tier: "recommended", "viable", or "caution"
- detail and diplomatic_perspective: arrays of 2-3 short bullets. diplomatic_perspective grounding: Ground every diplomatic_perspective bullet in a REAL, NAMED piece of diplomatic or institutional machinery relevant to ${countryName}. Use the actual vocabulary of ${countryName}'s policymakers. If a specific named mechanism is not genuinely applicable, do not force a citation — credibility comes from specificity where it is real.
- compatibility: specific to the energy commodity and import-dependent economy context
- source_article: Only attach a source_article if that specific article directly supports the specific recommendation or fact being stated in this option.
- historical_comparison: identify closest energy disruption pattern from the calibration set ONLY
- Never use numerical risk percentages or confidence scores
- Return ONLY valid JSON, no markdown, no preamble
- Do NOT include generated_at

JSON shape:
{
  "executive_summary": "string, 2-4 sentences on energy procurement outlook",
  "historical_comparison": "string, 1-2 sentences",
  "market_signals": {
    "freight_signal": { "status": "elevated|normal|insufficient_data", "note": "string" },
    "war_risk_zone_signal": { "status": "listed|not_listed|insufficient_data", "note": "string" }
  },
  "price_outlook": {
    "contributions": [
      { "factor": "Geopolitical Risk", "impact": 0, "explanation": "string" },
      { "factor": "Supply", "impact": 0, "explanation": "string" },
      { "factor": "Demand", "impact": 0, "explanation": "string" },
      { "factor": "Inventories", "impact": 0, "explanation": "string" },
      { "factor": "Shipping & Freight", "impact": 0, "explanation": "string" },
      { "factor": "Macro & USD", "impact": 0, "explanation": "string" },
      { "factor": "Market Sentiment", "impact": 0, "explanation": "string" },
      { "factor": "Historical Analogue Pull", "impact": 0, "explanation": "string" }
    ],
    "net_impact": 0,
    "predicted_range_low": 0,
    "predicted_range_high": 0,
    "rationale": "string"
  },
  "alternatives": [
    {
      "option_number": 1,
      "source": "string",
      "commodity": "string",
      "tier": "recommended|viable|caution",
      "summary": "string",
      "detail": ["bullet1", "bullet2"],
      "compatibility": "string",
      "diplomatic_perspective": ["bullet referencing real named agreements, institutions, or policy frameworks where relevant — not generic diplomatic language"],
      "dimension_assessment": [
        { "dimension": "name", "note": "specific, 8-15 words" }
      ],
      "source_article": { "title": "string", "url": "string" } or null
    }
  ],
  "disclaimer": "string"
}`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    executive_summary: { type: "STRING" },
    historical_comparison: { type: "STRING" },
    market_signals: {
      type: "OBJECT",
      properties: {
        freight_signal: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", enum: ["elevated", "normal", "insufficient_data"] },
            note: { type: "STRING" },
          },
          required: ["status", "note"],
        },
        war_risk_zone_signal: {
          type: "OBJECT",
          properties: {
            status: { type: "STRING", enum: ["listed", "not_listed", "insufficient_data"] },
            note: { type: "STRING" },
          },
          required: ["status", "note"],
        },
      },
      required: ["freight_signal", "war_risk_zone_signal"],
    },
    price_outlook: {
      type: "OBJECT",
      properties: {
        contributions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              factor: { type: "STRING" },
              impact: { type: "NUMBER" },
              explanation: { type: "STRING" },
            },
            required: ["factor", "impact", "explanation"],
          },
        },
        rationale: { type: "STRING" },
      },
      required: ["contributions", "rationale"],
    },
    alternatives: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          option_number: { type: "INTEGER" },
          source: { type: "STRING" },
          commodity: { type: "STRING" },
          tier: { type: "STRING", enum: ["recommended", "viable", "caution"] },
          summary: { type: "STRING" },
          detail: { type: "ARRAY", items: { type: "STRING" } },
          compatibility: { type: "STRING" },
          diplomatic_perspective: { type: "ARRAY", items: { type: "STRING" } },
          dimension_assessment: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                dimension: { type: "STRING" },
                note: { type: "STRING" },
              },
              required: ["dimension", "note"],
            },
          },
          source_article: {
            type: "OBJECT",
            nullable: true,
            properties: {
              title: { type: "STRING" },
              url: { type: "STRING" },
            },
          },
        },
        required: [
          "option_number",
          "source",
          "commodity",
          "tier",
          "summary",
          "detail",
          "compatibility",
          "diplomatic_perspective",
          "dimension_assessment",
        ],
      },
    },
    disclaimer: { type: "STRING" },
  },
  required: ["executive_summary", "historical_comparison", "market_signals", "price_outlook", "alternatives", "disclaimer"],
};

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-flash";

// Gemini sometimes emits literal escape sequences (e.g. "\u2014") that
// JSON.parse converts to actual Unicode characters, or double-escaped
// sequences that remain as literal text. This normalises both cases.
function sanitizeUnicodeEscapes(value: any): any {
  if (typeof value === "string") {
    return value
      .replace(/[\\/]u2014|[\u2014\u2012\u2015]/g, "-")
      .replace(/[\\/]u2013|[\u2013\u2010]/g, "-")
      .replace(/[\\/]u00b7|[\u00b7\u2022\u2023\u25cf]/gi, "-")
      .replace(/[\\/]u2018|[\u2018\u201A\u2039]/g, "'")
      .replace(/[\\/]u2019|[\u2019\u201B\u203A]/g, "'")
      .replace(/[\\/]u201c|[\u201c\u201E\u00AB]/g, '"')
      .replace(/[\\/]u201d|[\u201d\u201F\u00BB]/g, '"');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeUnicodeEscapes);
  }
  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = sanitizeUnicodeEscapes(value[key]);
    }
    return result;
  }
  return value;
}

function buildCrossModuleContext(): string {
  const cs = readCorridorStatus();
  if (!cs) return "";
  return `\n\nCross-module signal: Geopolitical Risk module currently rates the ${cs.corridorName} corridor as ${cs.status}.`;
}

async function callGemini(newsContext: string, systemPrompt: string, model = PRIMARY_MODEL, attempt = 1): Promise<any> {
  const MAX_ATTEMPTS = 2;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Recent news articles (JSON):\n${newsContext}${buildCrossModuleContext()}\n\nProduce the procurement briefing JSON now.`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4000,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    // 503 = model temporarily overloaded on Google's side; safe to retry with backoff
    if (response.status === 503 && attempt < MAX_ATTEMPTS) {
      const delayMs = 600;
      console.warn(`Gemini 503 on ${model} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callGemini(newsContext, systemPrompt, model, attempt + 1);
    }

    // Still overloaded after retries — drop down to a less-contended fallback model once
    if (response.status === 503 && model !== FALLBACK_MODEL) {
      console.warn(`${model} still overloaded after ${MAX_ATTEMPTS} attempts, falling back to ${FALLBACK_MODEL}`);
      return callGemini(newsContext, systemPrompt, FALLBACK_MODEL, 1);
    }

    console.error("Gemini API error body:", errorBody);
    throw new Error(`Gemini API request failed: ${response.status} — ${errorBody}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  // Strip accidental markdown fences just in case
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return sanitizeUnicodeEscapes(parsed);
  } catch (parseErr) {
    console.error("Gemini JSON parse failed, raw output:", raw);
    throw parseErr;
  }
}

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "true";
  const country = req.nextUrl.searchParams.get("country") || "India";

  if (!force) {
    const cached = cachedBriefings.get(country);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log(`[procurement/route] Serving cached briefing for ${country}`);
      return NextResponse.json({ ...cached.data, from_cache: true }, { status: 200 });
    }
  }

  try {
    const [articles, energyPrices] = await Promise.all([
      fetchNews(country).catch((err) => {
        console.error("fetchNews failed entirely, continuing without articles:", err);
        return [] as ReturnType<typeof fetchNews> extends Promise<infer T> ? T : never[];
      }),
      fetchEnergyPrices().catch((err) => {
        console.error("fetchEnergyPrices failed entirely, continuing without prices:", err);
        return {};
      }),
    ]);

    // If NewsAPI is unavailable (rate limit, server-side block, etc.),
    // fall back to curated mock articles so Gemini still produces a real briefing.
    // Country-specific mock articles used only when NewsAPI is unavailable
    const MOCK_ARTICLES_BY_COUNTRY: Record<string, typeof MOCK_ARTICLES_INDIA> = {
      Singapore: [
        {
          title: "Strait of Hormuz Tensions Threaten Singapore's Crude Imports",
          description: "Military activity near the Strait of Hormuz has heightened security alerts on tanker routes. Singapore, which imports 60% of its crude from Gulf states, faces rising freight premiums at Jurong Island and Pulau Bukom terminals.",
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          source: "Al Jazeera",
          url: "https://example.com/hormuz-tensions",
        },
        {
          title: "OPEC+ Production Cuts Squeeze Singapore Refining Margins",
          description: "OPEC+ output reductions are tightening Middle Eastern crude supply, raising feedstock costs for Singapore's Jurong Island refineries operated by ExxonMobil and SRC. LNG spot prices from Qatar also elevated.",
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          source: "Financial Times",
          url: "https://example.com/opec-cuts",
        },
        {
          title: "Singapore Explores Alternative Crude Sources to Reduce Gulf Dependence",
          description: "The Energy Market Authority (EMA) and major Singapore traders are evaluating US Gulf Coast WTI, West African Bonny Light, and Australian condensates to diversify away from Hormuz-exposed Middle Eastern crude supply lines.",
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          source: "Reuters",
          url: "https://example.com/singapore-energy-diversification",
        },
      ],
    };

    // Default India-specific mocks as the baseline
    const MOCK_ARTICLES_INDIA = [
      {
        title: "Strait of Hormuz Tensions Rise Amid Iran-US Standoff",
        description: "Naval standoffs in the Persian Gulf have increased insurance premiums for crude tankers. India imports a significant share of Gulf crude via routes near Hormuz.",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "Al Jazeera",
        url: "https://example.com/hormuz-tensions",
      },
      {
        title: "OPEC+ Extends Production Cuts, Brent Crude Rises",
        description: "OPEC+ extended output cuts through Q3. India, importing over 80% of crude, faces higher feedstock costs for refineries including Reliance, HPCL, and BPCL.",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: "Financial Times",
        url: "https://example.com/opec-cuts",
      },
      {
        title: "India Diversifies Energy Sources Amid Global Supply Chain Pressures",
        description: "Indian importers are diversifying crude, LNG, and coal sources as geopolitical disruptions and price volatility impact energy security.",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: "Reuters",
        url: "https://example.com/india-energy-diversification",
      },
    ];

    const MOCK_ARTICLES = MOCK_ARTICLES_BY_COUNTRY[country] ?? MOCK_ARTICLES_INDIA;

    const articlesToUse = articles.length > 0 ? articles : MOCK_ARTICLES;
    if (articles.length === 0) {
      console.log("[procurement/route] NewsAPI returned no articles — injecting mock articles for Gemini context.");
    }

    const obj = await callGemini(JSON.stringify(articlesToUse), getSystemPrompt(country));
    const briefing = {
      ...obj,
      generated_at: new Date().toISOString(),
      energy_prices: energyPrices
    };

    if (briefing.price_outlook?.contributions) {
      const netImpact = briefing.price_outlook.contributions.reduce(
        (sum: number, c: { impact: number }) => sum + (Number(c.impact) || 0),
        0,
      );
      briefing.price_outlook.net_impact = Math.round(netImpact * 100) / 100;

      for (const key of Object.keys(ENERGY_PRICE_SERIES)) {
        const prices = energyPrices as Record<string, PricePoint | null>;
        const current = prices[key]?.value;
        if (typeof current === "number") {
          const predicted = current + netImpact;
          briefing.price_outlook[`${key}_current`] = Math.round(current * 100) / 100;
          briefing.price_outlook[`${key}_predicted`] = Math.round(predicted * 100) / 100;
          briefing.price_outlook[`${key}_range_low`] = Math.round((predicted - 2.5) * 100) / 100;
          briefing.price_outlook[`${key}_range_high`] = Math.round((predicted + 2.5) * 100) / 100;
        }
      }
    }

    cachedBriefings.set(country, { data: briefing, cachedAt: Date.now() });
    console.log(`[procurement/route] Caching new briefing for ${country} from Gemini`);

    return NextResponse.json(briefing, { status: 200 });
  } catch (err) {
    console.error("Procurement API error:", err);
    return NextResponse.json(
      { error: "Failed to generate procurement briefing" },
      { status: 500 },
    );
  }
}