import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export const dynamic = "force-dynamic";

// Mirror of CORRIDOR_DEFS from TradeCorridors — same imports + ports data
const CORRIDOR_DETAIL: Record<string, { imports: string; ports: string }> = {
  hormuz: {
    imports: "Crude Oil (~35% of India's imports), LNG, Chemicals",
    ports: "Mundra, Kandla, Mumbai, Nhava Sheva, Kochi",
  },
  redsea: {
    imports: "Refined Petroleum, Manufactured Goods, Chemicals",
    ports: "Kochi, Mumbai, Mundra",
  },
  "bab-el-mandeb": {
    imports: "Refined Petroleum, Manufactured Goods, Chemicals",
    ports: "Kochi, Mumbai, Mundra",
  },
  suez: {
    imports: "Machinery, Auto Parts, Energy Products",
    ports: "Mundra, Mumbai, Nhava Sheva, Kochi",
  },
  malacca: {
    imports: "Electronic Components, Coal, Palm Oil",
    ports: "Chennai, Ennore, Vizag, Kolkata",
  },
};

function matchCorridorDetail(title: string): { imports: string; ports: string } | null {
  const t = title.toLowerCase();
  if (t.includes("hormuz") || t.includes("persian gulf") || t.includes("iran")) return CORRIDOR_DETAIL.hormuz;
  if (t.includes("bab") || t.includes("red sea") || t.includes("yemen")) return CORRIDOR_DETAIL["bab-el-mandeb"];
  if (t.includes("suez")) return CORRIDOR_DETAIL.suez;
  if (t.includes("malacca")) return CORRIDOR_DETAIL.malacca;
  return null;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY_COMMAND_CENTER;
    if (!apiKey) {
      console.warn("GROQ_API_KEY_COMMAND_CENTER not found. Returning fallback summary.");
      return NextResponse.json({
        summary: "Command Center offline mode. AI summary unavailable due to missing dedicated API key.",
        generatedAt: new Date().toISOString()
      });
    }

    const groq = new Groq({ apiKey });
    const { nesi, grf, srf, scrf, activeAlerts, scenarioRun, countryName = "India" } = await req.json();

    // Build rich alert context — include commodities + exposed ports, not just corridor names
    let alertsContext: string;
    if (activeAlerts && activeAlerts.length > 0) {
      const alertLines = activeAlerts.map((a: any) => {
        const detail = matchCorridorDetail(a.title ?? "");
        const detailStr = detail
          ? `\n    Commodities at risk: ${detail.imports}\n    Exposed ports: ${detail.ports}`
          : "";
        return `- [${a.severity}] ${a.title}${detailStr}`;
      });
      alertsContext = `Active Corridor Alerts (${activeAlerts.length} disruption${activeAlerts.length > 1 ? "s" : ""}):\n${alertLines.join("\n")}`;
    } else {
      alertsContext = "[CONTEXT NOTE: No active corridor alerts. All monitored chokepoints reporting normal traffic.]";
    }

    const scenarioContext = scenarioRun
      ? `Most Recent Scenario Simulation:\n  Name: ${scenarioRun.name}\n  Modelled Supply Gap: ${scenarioRun.supplyGap} MMT\n  Supply Shock Index (SSI): ${scenarioRun.ssi}`
      : "";

    const prompt = `You are a senior energy supply-chain analyst briefing a decision-maker in 4–5 sentences. The analysis must be specifically scoped to ${countryName}.

CRITICAL RULES — violations make the briefing useless:
1. DO NOT simply restate the numeric scores (GRF=${grf}, SRF=${srf}, ScRF=${scrf}, NESI=${nesi}). Those are already visible in the dashboard gauges directly above this text. Your job is to explain WHAT THEY MEAN and WHY, not to recite them.
2. DO NOT use bullet points, headings, or markdown. Flowing prose only.
3. DO NOT invent events, ports, prices, or news. Use ONLY the data supplied below.
4. The FIRST sentence must identify the primary operational risk in concrete terms (which corridor, which commodity/product flow, which ports are exposed).
5. Synthesize the impact of current corridor alerts on the supply chain's geopolitical resilience. Do NOT recite any arbitrary point mechanics or penalty calculations.
6. Address practical implications for ${countryName}'s energy supply chain — rerouting risk, freight cost exposure, which specific commodity/refinery input is strained.
${scenarioRun ? "7. Close by summarizing the insights from the recent scenario simulation and what it means for risk confidence." : ""}

SUPPLIED CONTEXT:
---
Country: ${countryName}
NESI Score: ${nesi}/100  |  GRF: ${grf}/100  |  SRF: ${srf}/100  |  ScRF: ${scrf}/100

${alertsContext}

${scenarioContext}
---

Briefing:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.15,
      max_tokens: 2048,
    });

    const summary = completion.choices[0]?.message?.content || "Summary could not be generated.";

    return NextResponse.json({
      summary,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error generating Command Center summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

