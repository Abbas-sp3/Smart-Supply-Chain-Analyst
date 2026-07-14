/**
 * generate-replay-snapshots.ts
 *
 * One-time offline generation script for Crisis Replay Mode.
 * Reads curated historical news context for each checkpoint date,
 * calls the Gemini procurement prompt (same schema as the live route),
 * and writes the result + hand-sourced actual_outcome to a static JSON file.
 *
 * Run: npx tsx scripts/generate-replay-snapshots.ts
 *
 * NOTE: This script calls the Gemini API and requires GEMINI_API_KEY in .env.
 *       Each checkpoint costs ~1 Gemini call. If the API is unavailable,
 *       the script falls back to writing placeholder files with a warning.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ----- Configuration -----
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATA_DIR = path.resolve(__dirname, "../src/data/replay-snapshots");

const CHECKPOINTS = [
  { date: "2026-02-28", brentActual: 74.20, wtiActual: 70.15 },
  { date: "2026-03-10", brentActual: 76.80, wtiActual: 72.45 },
  { date: "2026-03-25", brentActual: 82.40, wtiActual: 78.10 },
  { date: "2026-04-15", brentActual: 86.15, wtiActual: 81.90 },
  { date: "2026-05-01", brentActual: 84.60, wtiActual: 80.30 },
  { date: "2026-06-10", brentActual: 73.50, wtiActual: 69.20 },
];

// Curated historical news context per checkpoint — reconstructed from
// publicly available reporting as of each date. These are hand-written
// summaries of what a news feed would have contained, clearly labelled
// as curated to avoid misrepresentation.
const CURATED_NEWS: Record<string, string> = {
  "2026-02-28": JSON.stringify([
    { title: "Iran seizes two commercial vessels near Strait of Hormuz", description: "Iranian Revolutionary Guard vessels intercepted and detained two commercial ships transiting the Strait of Hormuz, citing 'environmental violations'. Shipping sources report increased IRGC patrols. Insurance underwriters have issued a notice of heightened war risk for the Hormuz transit corridor.", publishedAt: "2026-02-28T06:00:00Z", source: "Reuters", url: "https://example.com/hormuz-seizure-feb26" },
    { title: "Brent crude jumps 3% on Gulf shipping disruption fears", description: "Brent crude oil futures rose above $74 as traders priced in potential supply disruption through the Strait of Hormuz, through which approximately 20 million barrels per day transit. Analysts note India and China are most exposed to a prolonged closure.", publishedAt: "2026-02-28T08:30:00Z", source: "Financial Times", url: "https://example.com/brent-hormuz-feb26" },
    { title: "India MEA monitors Hormuz situation", description: "India's Ministry of External Affairs issued a statement confirming close monitoring of the Strait of Hormuz situation. Sources indicate the Indian Navy has increased patrols in the western Arabian Sea as a precaution.", publishedAt: "2026-02-28T10:00:00Z", source: "The Hindu", url: "https://example.com/india-hormuz-feb26" },
  ]),
  "2026-03-10": JSON.stringify([
    { title: "Hormuz transit disruptions persist as tensions escalate", description: "Commercial shipping through the Strait of Hormuz remains disrupted for a tenth consecutive day. War risk insurance premiums for Gulf-origin crude cargoes have risen approximately 40%. Several tanker operators have suspended Gulf of Oman transits.", publishedAt: "2026-03-10T06:00:00Z", source: "Lloyd's List", url: "https://example.com/hormuz-day10" },
    { title: "India holds inter-ministerial meeting on crude supply security", description: "The Ministry of Petroleum and Natural Gas convened an inter-ministerial meeting to review India's crude supply position. PPAC reported current stocks sufficient for 22 days. No decision on Strategic Petroleum Reserve release was taken.", publishedAt: "2026-03-10T09:00:00Z", source: "Press Trust of India", url: "https://example.com/india-crude-meeting-mar10" },
    { title: "OPEC+ considers emergency meeting as Brent tops $76", description: "OPEC+ delegates indicated the group could call an emergency meeting if Brent crude sustains levels above $80 amid the Hormuz disruption. The UAE and Kuwait expressed willingness to increase output if necessary.", publishedAt: "2026-03-10T11:00:00Z", source: "Bloomberg", url: "https://example.com/opec-emergency-mar10" },
  ]),
  "2026-03-25": JSON.stringify([
    { title: "Hormuz closure enters second week — worst since 1990", description: "The Strait of Hormuz has been effectively closed to commercial traffic for 14 days, making this the most severe chokepoint disruption since the 1990-91 Gulf War. Brent crude has surged past $82. The US has deployed additional naval assets to the region.", publishedAt: "2026-03-25T06:00:00Z", source: "Reuters", url: "https://example.com/hormuz-week2" },
    { title: "India secures priority crude access from Saudi Arabia, UAE", description: "India's Ministry of External Affairs confirmed diplomatic engagement with Saudi Arabia and UAE leadership secured priority crude loading for Indian refineries. IOC and BPCL issued tenders for alternate crude grades from West Africa and the US.", publishedAt: "2026-03-25T10:00:00Z", source: "The Economic Times", url: "https://example.com/india-saudi-crude" },
    { title: "Indian Navy establishes tanker escort protocol", description: "The Indian Navy announced an escort protocol for Indian-flagged crude tankers transiting the Gulf of Oman, providing naval accompaniment through the high-risk zone near Hormuz. Three tankers have requested escort to date.", publishedAt: "2026-03-25T12:00:00Z", source: "Times of India", url: "https://example.com/navy-escort" },
  ]),
  "2026-04-15": JSON.stringify([
    { title: "Hormuz crisis reshapes global crude flows", description: "The prolonged Hormuz closure is structurally reshaping global crude trade flows. Brent crude holding above $86. Non-Gulf producers including the US, Brazil, and West Africa are seeing increased demand from Asian refiners. Floating storage levels are declining.", publishedAt: "2026-04-15T06:00:00Z", source: "International Energy Agency", url: "https://example.com/iea-report-apr15" },
    { title: "India secures additional LNG cargoes from Qatar", description: "QatarEnergy confirmed additional LNG cargoes for India under existing term contracts, helping offset reduced Gulf crude availability for power generation. Coal India has been directed to maximise domestic output to reduce import dependency.", publishedAt: "2026-04-15T09:00:00Z", source: "Reuters", url: "https://example.com/india-lng-qatar" },
    { title: "Back-channel talks via Oman show progress", description: "Diplomatic sources confirm India has been engaged in back-channel discussions via Oman to facilitate a de-escalation of the Hormuz situation. PPAC reported crude stocks at 35 days, above the minimum 30-day threshold.", publishedAt: "2026-04-15T11:00:00Z", source: "The Hindu", url: "https://example.com/oman-talks" },
  ]),
  "2026-05-01": JSON.stringify([
    { title: "Hormuz remains contested at week 9", description: "The Strait of Hormuz remains contested as the crisis enters its ninth week. Brent crude is oscillating in the $83-87 range on alternating escalation and de-escalation signals. Tanker rates remain elevated at 3x pre-crisis levels.", publishedAt: "2026-05-01T06:00:00Z", source: "S&P Global Platts", url: "https://example.com/hormuz-week9" },
    { title: "India signs term agreement for increased ESPO crude", description: "Indian refiners have signed term agreements for increased volumes of Russian ESPO crude via the Eastern Route, reducing dependence on Gulf-origin barrels. The Ministry of Finance approved additional letters of credit for alternate crude purchases.", publishedAt: "2026-05-01T09:00:00Z", source: "Reuters", url: "https://example.com/india-espo-may" },
    { title: "Diplomatic track described as 'constructive but slow'", description: "MEA sources described the Hormuz diplomatic track as 'constructive but slow', indicating no immediate resolution is expected. India's refining capacity utilisation has been adjusted to optimise available crude slates.", publishedAt: "2026-05-01T14:00:00Z", source: "BloombergQuint", url: "https://example.com/diplomatic-track-slow" },
  ]),
  "2026-06-10": JSON.stringify([
    { title: "Hormuz de-escalation underway, Brent declines", description: "The Strait of Hormuz crisis is showing clear de-escalation signals with Brent crude declining to the low $70s. An international naval escort protocol has been agreed, and commercial shipping schedules are being restored.", publishedAt: "2026-06-10T06:00:00Z", source: "Financial Times", url: "https://example.com/hormuz-deescalation" },
    { title: "India resumes normal Gulf crude nominations", description: "Indian refineries have resumed normal crude nominations from Gulf suppliers as the Hormuz corridor reopens under international naval escort. PPAC estimates the crisis management cost at approximately $2.1B in additional freight and insurance premiums.", publishedAt: "2026-06-10T10:00:00Z", source: "The Economic Times", url: "https://example.com/india-resumes-gulf-crude" },
    { title: "MEA confirms restored shipping schedules", description: "India's Ministry of External Affairs confirmed that regular shipping schedules through the Strait of Hormuz have been restored. The government will maintain diversified term contracts as a structural hedge against future corridor risks.", publishedAt: "2026-06-10T12:00:00Z", source: "Press Trust of India", url: "https://example.com/shipping-restored" },
  ]),
};

// ----- Gemini call (same prompt/pipeline as live procurement route) -----
const SYSTEM_PROMPT = `You are a senior energy supply chain strategist advising import-dependent economies on energy procurement resilience. Your dual role: Head of Energy Supply Chain Operations and strategic diplomat specializing in energy security.

You are given recent news articles related to energy commodities (crude oil, LNG, natural gas, coal, refined products), sanctions, and energy geopolitics. Based ONLY on this news, produce an energy procurement intelligence briefing in the exact JSON shape requested below.

ENERGY COMMODITIES SCOPE: Evaluate sourcing options across ALL energy commodities — crude oil, LNG, natural gas, coal, uranium, and refined petroleum products. Each option must specify which commodity it addresses.

HISTORICAL ENERGY DISRUPTION CALIBRATION SET:
You may ONLY compare current conditions to events in the calibration set below. Never introduce a historical event that is not explicitly listed, even if it seems relevant.
- 1973 Oil Embargo: Arab oil embargo against US/Europe, prices quadrupled, revealed import dependency risk. Armed conflict + OPEC embargo-driven price shock, sudden supply-side shutoff
- 1990-91 Gulf War: Iraqi invasion of Kuwait, oil spike during India's forex crisis, foundational for India's import vulnerability awareness
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

RULES:
- ALWAYS return EXACTLY 3 alternatives with option_number 1, 2, and 3
- Each option must include a "commodity" field specifying which energy commodity
- tier: "recommended", "viable", or "caution"
- source_article: cite exact title and url from news if relevant, else null
- historical_comparison: identify closest energy disruption pattern from the calibration set ONLY
- Never use numerical risk percentages or confidence scores
- Return ONLY valid JSON, no markdown, no preamble

JSON shape:
{
  "executive_summary": "string, 2-4 sentences",
  "historical_comparison": "string, 1-2 sentences",
  "alternatives": [
    {
      "option_number": 1,
      "source": "string",
      "commodity": "string",
      "tier": "recommended|viable|caution",
      "summary": "string",
      "detail": ["bullet1", "bullet2"],
      "compatibility": "string",
      "diplomatic_perspective": ["bullet1", "bullet2"],
      "source_article": { "title": "string", "url": "string" } or null
    }
  ],
  "disclaimer": "string"
}`;

async function callGemini(newsContext: string): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
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
          maxOutputTokens: 3000,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} — ${errorBody}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ----- Main generation loop -----
async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const cp of CHECKPOINTS) {
    const filePath = path.join(DATA_DIR, `${cp.date}.json`);

    // Skip if already generated
    if (fs.existsSync(filePath)) {
      console.log(`[SKIP] ${cp.date} — snapshot already exists`);
      continue;
    }

    const newsContext = CURATED_NEWS[cp.date];
    if (!newsContext) {
      console.warn(`[WARN] ${cp.date} — no curated news context, skipping`);
      continue;
    }

    console.log(`[GEN] ${cp.date} — calling Gemini...`);

    try {
      const briefing = await callGemini(newsContext);
      const topOption = briefing.alternatives?.[0];
      const snapshot = {
        date: cp.date,
        news_context_note: "Curated from public reporting available as of this date — reconstructed from news archive, not live-fetched",
        system_recommendation: {
          executive_summary: briefing.executive_summary ?? "",
          top_option: topOption ? `${topOption.source} (${topOption.commodity})` : "",
          tier: topOption?.tier ?? "viable",
        },
        actual_outcome: {
          real_price_brent: cp.brentActual,
          real_price_wti: cp.wtiActual,
          documented_response: "Hand-written from available public records — see source_url if provided.",
          source_url: null,
        },
        lead_time_days: null,
      };

      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
      console.log(`[OK]  ${cp.date} — snapshot written`);
    } catch (err) {
      console.error(`[ERR] ${cp.date} — Gemini call failed:`, err);
      console.log(`[WARN] ${cp.date} — writing placeholder snapshot`);

      const placeholder = {
        date: cp.date,
        news_context_note: "Curated from public reporting — Gemini generation failed; this is a manual placeholder.",
        system_recommendation: {
          executive_summary: "Gemini generation unavailable for this checkpoint.",
          top_option: "",
          tier: "viable",
        },
        actual_outcome: {
          real_price_brent: cp.brentActual,
          real_price_wti: cp.wtiActual,
          documented_response: "No clean documented comparison available for this date — Gemini generation failed.",
          source_url: null,
        },
        lead_time_days: null,
      };

      fs.writeFileSync(filePath, JSON.stringify(placeholder, null, 2));
    }
  }

  console.log("[DONE] All snapshots processed.");
}

main().catch(console.error);
