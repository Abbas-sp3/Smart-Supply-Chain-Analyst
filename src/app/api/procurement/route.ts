import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedBriefing: Record<string, unknown> | null = null;
let cachedAt = 0;

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EIA_API_KEY = process.env.EIA_API_KEY;

const SEARCH_QUERY =
  "Strait of Hormuz OR crude oil sanctions OR Gulf tensions OR India crude imports";

type PricePoint = { value: number; asOf: string; changePct: number | null };

async function fetchEiaSeries(series: string): Promise<PricePoint | null> {
  try {
    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=${series}&sort[0][column]=period&sort[0][direction]=desc&length=2`;
    // Hard timeout so a dead/unreachable EIA host fails fast instead of hanging
    // for 10+ seconds trying multiple IP addresses and taking the whole request down
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
    // Network failure (EIA unreachable, DNS issue, timeout, etc.) — log it but
    // never let this crash the whole procurement response, just return no price
    console.error(`EIA fetch error for ${series} (network/connectivity issue, not a code bug):`, err);
    return null;
  }
}

async function fetchMarketPrices() {
  // RBRTE = Europe Brent Spot Price FOB, RWTC = Cushing OK WTI Spot Price FOB
  const [brent, wti] = await Promise.all([
    fetchEiaSeries("RBRTE"),
    fetchEiaSeries("RWTC"),
  ]);
  return { brent, wti };
}

async function fetchNews() {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    SEARCH_QUERY,
  )}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`NewsAPI request failed: ${res.status}`);
  }
  const data = await res.json();

  return (data.articles ?? []).map(
    (a: { title: string; description: string; publishedAt: string; source: { name: string }; url: string }) => ({
      title: a.title,
      description: a.description,
      publishedAt: a.publishedAt,
      source: a.source?.name,
      url: a.url,
    }),
  );
}

const SYSTEM_PROMPT = `You are two people at once: a Head of Supply Chain Operations 
for India's energy sector, and a career Indian diplomat who has spent decades 
thinking about India's strategic relationships — with the Gulf states, Russia, the 
US, and China. When you evaluate a sourcing option, you don't just check logistics 
and cost — you instinctively think the way a diplomat in South Block would: What 
does this do to our relationship with this country? Does this expose India to 
someone else's sanctions regime? Does this help or strain a partnership we've spent 
years building? What would this look like in a parliamentary question, or in how 
Washington or Moscow reads it? Let that instinct shape your reasoning naturally, 
the way an experienced person would think it through, not as a checklist you 
run through mechanically.

You are given a list of recent news articles (with titles, descriptions, and URLs) 
related to crude oil, sanctions, and Gulf/shipping geopolitics. Based ONLY on this 
news, produce a procurement intelligence briefing in the exact JSON shape requested 
below.

HISTORICAL CALIBRATION SET (use for the historical_comparison field — draw on the 
closest matching pattern, not just the most recent one):
- 1990–91 Gulf War / Indian Balance-of-Payments crisis — Iraqi invasion of Kuwait 
  spiked oil prices sharply just as India faced a severe forex crisis; this 
  directly triggered India's 1991 New Economic Policy (liberalization), reshaping 
  how India manages energy import dependency ever since. Treat this as the 
  foundational reference point for India-specific crude import vulnerability.
- 2003 Iraq War / Iraqi oil export halt — armed conflict-driven, prolonged production loss, partially offset by OPEC spare capacity
- 2008 Global financial crisis oil price crash — demand-driven collapse, not supply disruption, prices fell despite no supply loss
- 2011 Libyan Civil War — armed conflict, near-total loss of Libyan exports for months, absorbed by Saudi spare capacity
- 2014–2016 oil price crash — oversupply-driven (US shale + OPEC non-cut), opposite pattern to a disruption: prices fell due to excess supply
- 2019 Abqaiq attack (Saudi Arabia) — sudden supply shock via drone/missile strike, no prolonged closure, repaired within weeks
- 2020 COVID-19 demand collapse — demand-side shock, historic price collapse (briefly negative WTI), not a supply chokepoint event
- 2021 Suez Canal blockage (Ever Given) — single-vessel chokepoint failure, short duration (about a week), high shipping cost spike
- 2022 Russia-Ukraine war energy shock — sanctions-driven, prolonged, restructured global crude flows (India increasing Russian imports)
- 2023–2024 Red Sea / Houthi shipping attacks — chokepoint security threat (Bab-el-Mandeb), forced rerouting via Cape of Good Hope, prolonged
- 2025–26 Gulf tensions / Hormuz closure — corridor closure, roughly 4 months, closest direct analog to a full Hormuz shutdown

When assessing current conditions, identify which of these is the closest structural 
match (armed conflict vs. sanctions vs. chokepoint security vs. demand-side vs. 
oversupply vs. balance-of-payments/import-dependency crisis) rather than defaulting 
to the most recent event by habit. When relevant, note whether current conditions 
echo the structural vulnerability India first confronted in 1991 — i.e. high import 
dependency colliding with a geopolitical shock.

REFINERY GRADE COMPATIBILITY (use for the refinery_compatibility field per option):
Indian refineries (e.g. Jamnagar-class) are configured primarily for Arab Light / 
Iraqi Basra-type crude. Use this general rule of thumb:
- Gulf-grade-compatible sources (UAE, Iraq, Saudi) → "Compatible, minimal penalty"
- Medium-sour or blended grades (Russia, Kuwait) → "Compatible, minor efficiency penalty"
- Distant/light grades (Angola, Nigeria, US shale) → "Grade mismatch, moderate to high efficiency penalty expected"
State this plainly per option, don't invent a specific percentage.

MARKET SIGNALS (for the "market_signals" field — derived ONLY from the provided 
news articles, not invented):
- "freight_signal": your read on whether tanker freight/charter rates for Gulf-
  transiting or India-bound crude cargoes are being reported as elevated, disrupted, 
  or normal based on the articles. Use status "elevated", "normal", or 
  "insufficient_data" (if the news simply doesn't cover freight/shipping costs — 
  do not guess). Give a one-sentence note explaining the basis for that status, 
  and if it's "insufficient_data" say so plainly rather than inventing a rate.
- "war_risk_zone_signal": your read on whether the news indicates insurers or 
  maritime authorities (e.g. Joint War Committee-style listed-area designations) 
  are treating the Gulf/Hormuz corridor as an elevated war-risk zone right now. 
  Use status "listed", "not_listed", or "insufficient_data". This is a directional 
  read from news coverage, NOT a live check of the actual Lloyd's Market Association 
  Joint War Committee listed-areas register — say so in the note, and point out 
  that an authoritative check should go directly to the LMA/JWC listing.
- Never invent a specific freight rate, insurance premium percentage, or dollar 
  figure for either of these — status + qualitative note only.

PRICE OUTLOOK — WATERFALL CONTRIBUTION MODEL (for the "price_outlook" field):
Instead of a single vague trend, break the outlook into individual market factors, 
each contributing a directional USD impact, the way a trading-desk waterfall chart 
works. Use ONLY these 8 factors, in this exact order:
1. Geopolitical Risk (Hormuz/Gulf tensions, sanctions, conflict — usually your 
   biggest swing factor given the current context)
2. Supply (OPEC+/non-OPEC production changes, outages)
3. Demand (China/India/US consumption signals)
4. Inventories (EIA/API stock build or draw signals, if mentioned)
5. Shipping & Freight (route disruption, freight rate signals)
6. Macro & USD (Fed policy, dollar strength, recession risk)
7. Market Sentiment (trader/analyst positioning signals from the news)
8. Historical Analogue Pull (how similar this is to a calibration-set event, 
   pulling price expectation toward or away from that event's known outcome)

For EACH factor, estimate a small USD-per-barrel impact (e.g. +1.5, -0.8, 0 if 
neutral/no signal) based ONLY on what the news actually supports — if a factor 
isn't covered by the news, use impact 0 and explanation "No clear signal in 
current news". Do NOT invent impacts to make the waterfall look complete.

Sum all 8 impacts to get a "net_impact" (can be positive, negative, or zero).
"predicted_range_low" and "predicted_range_high" should bracket 
(current_price + net_impact) by roughly ±2-3 to reflect genuine uncertainty — 
NEVER present a single precise predicted number without this range.
"rationale" is a 1-2 sentence summary of the 2-3 biggest movers.

PROCUREMENT DECISION DIMENSIONS (this is the full universe of lenses to consider 
silently for every option — do NOT output all of them):

Strategic, Financial & Commercial, Supplier Capability, Quality, Operational, 
Logistics, Supplier Performance, Financial Health of Supplier, Risk, Geopolitical, 
Economic, Market, Legal & Regulatory, Contractual, Technology, Cybersecurity, 
National Security, Environmental, Social, ESG, Resilience, Resilience to External 
Events, Infrastructure, Human Capital, Innovation, Relationship, Ethical, Demand, 
Inventory, Product, Country, Supplier Network, Raw Material, Transportation Route, 
Time, Future Outlook, Stakeholder, Decision Environment.

For each option, produce a "dimension_assessment" array containing ONLY the 4 to 6 
dimensions from this list that are genuinely decision-critical for THIS option given 
the current news and diplomatic context — the ones a diplomat or procurement lead 
would actually need to see before signing off, not a mechanical sweep of everything. 
Each item is { "dimension": "<name>", "note": "<one concise sentence, 8-15 words, 
specific to this option and current conditions — no filler>" }.
- Do NOT pad this list to reach a fixed count, and do NOT include a dimension just 
  to cover it — every dimension you list must carry a real, option-specific note.
- Never write "Not assessable from current data" or similar filler — if a dimension 
  isn't genuinely load-bearing for this option, leave it out entirely rather than 
  including it with a placeholder note.
- Order the array by importance, most decision-critical dimension first.
- Different options can (and should) surface different dimensions if that's what's 
  actually relevant — don't force all three options into the same template.
- Never use numerical risk percentages or confidence scores.
- Never recommend airlift for bulk crude oil, only for critical low-volume cargo.
- ALWAYS return EXACTLY 3 items in the "alternatives" array, numbered 1, 2, and 3 
  via the "option_number" field. Never return fewer than 3, even if you must 
  include a lower-confidence option numbered 3 with tier "caution".
- For each option, write "detail" and "diplomatic_perspective" as arrays of 2-3 
  short bullet points (each one sentence, plain language), NOT as a single dense 
  paragraph. This is for a fast-reading operational dashboard, not a report.
- Every option must include a plain-language operational summary, 2-3 detail 
  bullet points, a refinery compatibility note, and 2-3 diplomatic_perspective 
  bullet points written the way the diplomat persona above would actually think 
  it through — specific and honest about trade-offs, not a generic "this is 
  safe" line. If a specific provided article directly supports that option, 
  cite it using its EXACT title and url as given in the input — never invent or 
  alter a URL. If no specific article supports it, set source_article to null.
- Include a one-sentence historical_comparison anchoring current conditions to 
  the closest matching event in the calibration set above, and briefly say why.
- Include a disclaimer that this supports, not replaces, procurement decisions, 
  and that diplomatic assessments are directional, not a substitute for Ministry 
  of External Affairs or trade-policy review.
- If the news does not clearly indicate a disruption, say so plainly rather 
  than inventing one — but still return 3 general options based on known 
  supplier diversification choices.
- Do NOT include a "generated_at" field — it will be added automatically.
- NEVER write literal unicode escape sequences like \\u2014, \\u2013, \\u00b7, or 
  \\u2018 as text inside any field. Use plain ASCII characters only: a regular 
  hyphen (-) for dashes, and a regular hyphen (-) for bullet-style lists. Do 
  not use em-dashes, en-dashes, curly quotes, or bullet-point unicode 
  characters anywhere in your output — plain ASCII text only.
- Return ONLY valid JSON, no markdown fences, no preamble, no explanation text.

JSON shape to return:
{
  "executive_summary": "string, 2-4 sentences",
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
      "tier": "recommended|viable|caution",
      "summary": "string, one sentence",
      "detail": ["bullet point 1", "bullet point 2", "bullet point 3 (optional)"],
      "refinery_compatibility": "string",
      "diplomatic_perspective": ["bullet point 1", "bullet point 2", "bullet point 3 (optional)"],
      "dimension_assessment": [
        { "dimension": "<name of a genuinely critical dimension>", "note": "string, 8-15 words, specific to this option" },
        "... 4 to 6 items total, most important first, no filler entries ..."
      ],
      "source_article": { "title": "string", "url": "string" } or null
    },
    { "option_number": 2, "...": "same shape" },
    { "option_number": 3, "...": "same shape" }
  ],
  "critical_cargo": {
    "item": "string or null if not applicable",
    "detail": "string",
    "mode": "airlift or pipeline or sea",
    "eta": "string"
  } or null,
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
          tier: { type: "STRING", enum: ["recommended", "viable", "caution"] },
          summary: { type: "STRING" },
          detail: { type: "ARRAY", items: { type: "STRING" } },
          refinery_compatibility: { type: "STRING" },
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
          "tier",
          "summary",
          "detail",
          "refinery_compatibility",
          "diplomatic_perspective",
          "dimension_assessment",
        ],
      },
    },
    critical_cargo: {
      type: "OBJECT",
      nullable: true,
      properties: {
        item: { type: "STRING" },
        detail: { type: "STRING" },
        mode: { type: "STRING" },
        eta: { type: "STRING" },
      },
    },
    disclaimer: { type: "STRING" },
  },
  required: ["executive_summary", "historical_comparison", "market_signals", "price_outlook", "alternatives", "disclaimer"],
};

const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const FALLBACK_MODEL = "gemini-2.5-flash-lite";

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

async function callGemini(newsContext: string, model = PRIMARY_MODEL, attempt = 1): Promise<any> {
  const MAX_ATTEMPTS = 2;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Recent news articles (JSON):\n${newsContext}\n\nProduce the procurement briefing JSON now.`,
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
      return callGemini(newsContext, model, attempt + 1);
    }

    // Still overloaded after retries — drop down to a less-contended fallback model once
    if (response.status === 503 && model !== FALLBACK_MODEL) {
      console.warn(`${model} still overloaded after ${MAX_ATTEMPTS} attempts, falling back to ${FALLBACK_MODEL}`);
      return callGemini(newsContext, FALLBACK_MODEL, 1);
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

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("force") === "true";
  const cacheIsFresh = cachedBriefing && Date.now() - cachedAt < CACHE_TTL_MS;

  if (cacheIsFresh && !force) {
    return NextResponse.json({ ...cachedBriefing, from_cache: true }, { status: 200 });
  }

  try {
    const [articles, marketPrices] = await Promise.all([
      fetchNews(),
      fetchMarketPrices().catch((err) => {
        console.error("fetchMarketPrices failed entirely, continuing without prices:", err);
        return { brent: null, wti: null };
      }),
    ]);

    if (articles.length === 0) {
      return NextResponse.json(
        {
          generated_at: new Date().toISOString(),
          executive_summary:
            "No relevant news articles were found in the current search window.",
          market_signals: {
            freight_signal: { status: "insufficient_data", note: "No news articles available this cycle." },
            war_risk_zone_signal: { status: "insufficient_data", note: "No news articles available this cycle." },
          },
          market_prices: marketPrices,
          alternatives: [],
          critical_cargo: null,
          disclaimer:
            "This output supports procurement decisions; it does not make them.",
        },
        { status: 200 },
      );
    }

    const briefing = await callGemini(JSON.stringify(articles));
    briefing.generated_at = new Date().toISOString();
    briefing.market_prices = marketPrices;

    // Compute the actual predicted price server-side from real current prices +
    // the model's per-factor impacts — never trust the model to do this arithmetic
    // itself, since that's exactly the kind of number a model can silently invent.
    if (briefing.price_outlook?.contributions) {
      const netImpact = briefing.price_outlook.contributions.reduce(
        (sum: number, c: { impact: number }) => sum + (Number(c.impact) || 0),
        0,
      );
      briefing.price_outlook.net_impact = Math.round(netImpact * 100) / 100;

      for (const key of ["brent", "wti"] as const) {
        const current = marketPrices[key]?.value;
        if (typeof current === "number") {
          const predicted = current + netImpact;
          briefing.price_outlook[`${key}_current`] = Math.round(current * 100) / 100;
          briefing.price_outlook[`${key}_predicted`] = Math.round(predicted * 100) / 100;
          briefing.price_outlook[`${key}_range_low`] = Math.round((predicted - 2.5) * 100) / 100;
          briefing.price_outlook[`${key}_range_high`] = Math.round((predicted + 2.5) * 100) / 100;
        }
      }
    }

    cachedBriefing = briefing;
    cachedAt = Date.now();

    return NextResponse.json(briefing, { status: 200 });
  } catch (err) {
    console.error("Procurement API error:", err);
    return NextResponse.json(
      { error: "Failed to generate procurement briefing" },
      { status: 500 },
    );
  }
}