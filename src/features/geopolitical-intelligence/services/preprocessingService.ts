import { callGroq } from "./groqService";
import type {
  DataSourceOutput,
  NewsFact,
  MilitaryFact,
  MaritimeFact,
  AugmentedObservation,
  PrioritizationMetadata,
} from "../types";
import { buildKnowledgeGraphContext } from "../knowledge-graph";

/**
 * Extracts structured facts from News data using a fast LLM pass.
 */
async function extractNewsFacts(newsData: unknown[]): Promise<NewsFact[]> {
  if (!newsData || newsData.length === 0) return [];

  const prompt = `You are a Fact Extraction engine. Convert the following news summaries into structured observations.
For each news item, extract the following JSON structure exactly:
{
  "facts": [
    {
      "event": "Brief description of the event",
      "country": "Primary country involved",
      "region": "Primary region",
      "category": "e.g., Geopolitical, Logistics, Trade",
      "affected_products": ["List", "of", "products"],
      "affected_trade_routes": ["List", "of", "routes"],
      "keywords": ["Strategic", "Keywords"]
    }
  ]
}

Only return valid JSON. Do not include markdown formatting or explanations.

News Items:
${JSON.stringify(newsData, null, 2)}
`;

  try {
    const rawResponse = await callGroq("You are a strict JSON data extractor.", prompt, "llama-3.1-8b-instant", 2048);
    const jsonStr = rawResponse.replace(/```(?:json)?\s*([\s\S]*?)```/, "$1").trim();
    const parsed = JSON.parse(jsonStr) as { facts: NewsFact[] };
    return parsed.facts || [];
  } catch (error) {
    console.error("[preprocessingService] Failed to extract news facts:", error);
    return [];
  }
}

/**
 * Heuristically converts Military raw data to structured facts.
 */
function extractMilitaryFacts(militaryData: Record<string, unknown> | null | undefined): MilitaryFact[] {
  if (!militaryData) return [];
  const facts: MilitaryFact[] = [];

  const count = typeof militaryData.count === "number" ? militaryData.count : 0;
  const mockData = typeof militaryData.mockData === "string" ? militaryData.mockData : "";

  if (count > 0) {
    facts.push({
      aircraft: "Military Logistics Aircraft",
      country: "Multiple",
      region: "Middle East / Indian Ocean",
      observation: `Detected ${count} active military or logistics aircraft in the monitored region.`,
      operational_relevance: "Elevated military logistics often precede geopolitical shifts or conflict escalation.",
    });
  }
  
  if (mockData) {
    facts.push({
      aircraft: "Mixed Military Logistics",
      country: "Unknown",
      region: "Red Sea / Arabian Sea",
      observation: mockData.replace("MOCK MILITARY AVIATION INTELLIGENCE (Credentials missing or API failed):\n", "").trim(),
      operational_relevance: "Potential disruption to trade routes due to regional military posturing.",
    });
  }

  return facts;
}

/**
 * Heuristically converts Maritime raw data to structured facts.
 */
function extractMaritimeFacts(maritimeData: Record<string, unknown> | null | undefined): MaritimeFact[] {
  if (!maritimeData) return [];
  const facts: MaritimeFact[] = [];

  const shipTypes = (maritimeData.shipTypes as Record<string, number>) || {};
  const mockData = typeof maritimeData.mockData === "string" ? maritimeData.mockData : "";

  const tankers = (shipTypes.Tanker || 0) + (shipTypes.Cargo || 0);
  
  if (tankers > 5) {
    facts.push({
      event: "High Commercial Vessel Concentration",
      route: "Major Chokepoints",
      vessel_type: "Tanker / Cargo",
      observation: `Detected ${tankers} commercial cargo and tanker vessels operating in monitored zones.`,
      operational_relevance: "High traffic concentration increases vulnerability to chokepoint closures.",
    });
  }

  if (mockData) {
    facts.push({
      event: "Route Deviations & Congestion",
      route: "Red Sea / Singapore",
      vessel_type: "Container / Tanker",
      observation: mockData.replace("MOCK MARITIME INTELLIGENCE (No AIS data or no key):\n", "").trim(),
      operational_relevance: "Direct impact on transit times and logistics costs for Indian imports.",
    });
  }

  return facts;
}

const CRITICAL_KEYWORDS = [
  "hormuz", "bab-el-mandeb", "suez", "red sea", "malacca", "south china sea", "taiwan", "panama canal", "black sea",
  "crude oil", "lng", "semiconductor", "rare earth", "pharmaceutical", "api", "food grain", "fertilizer"
];

const HIGH_KEYWORDS = [
  "lpg", "natural gas", "coal", "copper", "steel", "lithium", "cobalt", "critical mineral", "shipping container", "port"
];

function assignPriority(text: string, kgContext: string): PrioritizationMetadata {
  const lower = text.toLowerCase();
  
  let level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "BACKGROUND" = "BACKGROUND";
  
  if (CRITICAL_KEYWORDS.some(k => lower.includes(k))) {
    level = "CRITICAL";
  } else if (HIGH_KEYWORDS.some(k => lower.includes(k))) {
    level = "HIGH";
  } else if (kgContext.length > 10) {
    level = "MEDIUM";
  }

  return {
    priority_level: level,
    business_criticality: level === "CRITICAL" || level === "HIGH" ? "Direct impact on Indian import continuity" : "Indirect or long-term impact",
    strategic_importance: level === "CRITICAL" ? "National Security / Core Economic Concern" : "Sector-specific concern",
    time_horizon: level === "CRITICAL" ? "Immediate to Short-Term (0-3 months)" : "Medium to Long-Term"
  };
}

/**
 * Augments facts with Knowledge Graph context, assigns priority, and filters.
 */
export async function preprocessIntelligence(
  sources: DataSourceOutput[]
): Promise<AugmentedObservation[]> {
  console.log("[preprocessingService] Starting Fact Extraction & Prioritization...");

  const newsSource = sources.find((s) => s.source === "NewsAPI");
  const militarySource = sources.find((s) => s.source.includes("OpenSky"));
  const maritimeSource = sources.find((s) => s.source.includes("AIS"));

  const [newsFacts, militaryFacts, maritimeFacts] = await Promise.all([
    extractNewsFacts((newsSource?.data as unknown[]) || []),
    Promise.resolve(extractMilitaryFacts(militarySource?.data as Record<string, unknown> | null | undefined)),
    Promise.resolve(extractMaritimeFacts(maritimeSource?.data as Record<string, unknown> | null | undefined)),
  ]);

  const augmented: AugmentedObservation[] = [];

  // Augment & Prioritize News
  for (const fact of newsFacts) {
    const contextStr = fact.keywords.join(" ") + " " + fact.affected_products.join(" ") + " " + fact.affected_trade_routes.join(" ");
    const kgContext = buildKnowledgeGraphContext([{ source: "Extraction", data: contextStr }]);
    const fullText = Object.values(fact).join(" ");
    const priority = assignPriority(fullText, kgContext);
    augmented.push({ type: "News", fact, knowledge_graph_context: kgContext, prioritization: priority });
  }

  // Augment & Prioritize Military
  for (const fact of militaryFacts) {
    const kgContext = buildKnowledgeGraphContext([{ source: "Extraction", data: fact.region }]);
    const fullText = Object.values(fact).join(" ");
    const priority = assignPriority(fullText, kgContext);
    // Elevate military implicitly
    if (priority.priority_level === "BACKGROUND") priority.priority_level = "LOW";
    augmented.push({ type: "Military", fact, knowledge_graph_context: kgContext, prioritization: priority });
  }

  // Augment & Prioritize Maritime
  for (const fact of maritimeFacts) {
    const kgContext = buildKnowledgeGraphContext([{ source: "Extraction", data: fact.route }]);
    const fullText = Object.values(fact).join(" ");
    const priority = assignPriority(fullText, kgContext);
    // Elevate maritime implicitly
    if (priority.priority_level === "BACKGROUND") priority.priority_level = "LOW";
    augmented.push({ type: "Maritime", fact, knowledge_graph_context: kgContext, prioritization: priority });
  }

  console.log(`[preprocessingService] Extracted, Augmented & Prioritized ${augmented.length} total facts.`);

  // Relevance Filter: Sort by priority first
  const priorityScore = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "BACKGROUND": 0 };
  
  augmented.sort((a, b) => {
    const scoreA = priorityScore[a.prioritization?.priority_level || "BACKGROUND"];
    const scoreB = priorityScore[b.prioritization?.priority_level || "BACKGROUND"];
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // Tie breaker on KG context
    const aHasContext = a.knowledge_graph_context.length > 5 ? 1 : 0;
    const bHasContext = b.knowledge_graph_context.length > 5 ? 1 : 0;
    return bHasContext - aHasContext;
  });

  // Limit Context to Top 10-15 Observations
  const finalSet = augmented.slice(0, 15);
  console.log(`[preprocessingService] Prioritization complete. Kept top ${finalSet.length} critical facts.`);

  return finalSet;
}
