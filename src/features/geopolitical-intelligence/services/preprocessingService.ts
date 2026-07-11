/**
 * preprocessingService.ts — Fact Extraction, Knowledge-Graph-Aware Priority, Evidence Fusion
 *
 * Changes from previous version:
 *  1. Priority is determined by knowledge graph strategic weights, not hardcoded keyword lists
 *  2. Cross-source correlation detects when multiple observation types mention related entities
 *  3. Fused (multi-source corroborated) observations are prioritized higher
 */

import { callGroq } from "./groqService";
import { parseAndNormalizeLLMResponse } from "@/services/llm";
import type {
  DataSourceOutput,
  NewsFact,
  MilitaryFact,
  MaritimeFact,
  AugmentedObservation,
  PrioritizationMetadata,
} from "../types";
import {
  buildKnowledgeGraphContext,
  type KnowledgeGraphResult,
} from "../knowledge-graph";

function safeJoin(values: string[] | undefined | null): string {
  return (values ?? []).join(" ");
}

function sanitizeNewsFact(fact: Partial<NewsFact>): NewsFact {
  return {
    event: fact.event ?? "",
    country: fact.country ?? "",
    region: fact.region ?? "",
    category: fact.category ?? "",
    affected_products: Array.isArray(fact.affected_products)
      ? fact.affected_products
      : [],
    affected_trade_routes: Array.isArray(fact.affected_trade_routes)
      ? fact.affected_trade_routes
      : [],
    keywords: Array.isArray(fact.keywords) ? fact.keywords : [],
  };
}

/**
 * Extracts structured facts from News data using a fast LLM pass.
 */
async function extractNewsFacts(newsData: unknown[]): Promise<NewsFact[]> {
  if (!newsData || newsData.length === 0) return [];

  const prompt = `You are a Fact Extraction engine for a Supply Chain Intelligence system focused on India's imports.
Convert the following news summaries into structured observations.
Focus on extracting SUPPLY CHAIN relevant information — not just political narrative.

For each news item, extract the following JSON structure exactly:
{
  "news_facts": [
    {
      "event": "Brief description of the event and its supply chain relevance",
      "country": "Primary country involved",
      "region": "Primary region",
      "category": "e.g., Energy Disruption, Trade Restriction, Maritime Security, Logistics, Sanctions, Climate Impact, Political Instability",
      "affected_products": ["List", "of", "specific", "products/commodities"],
      "affected_trade_routes": ["List", "of", "specific", "corridors/routes"],
      "keywords": ["Strategic", "Keywords", "for", "matching"]
    }
  ]
}

Only return valid JSON. Do not include markdown formatting or explanations.
Do NOT omit required fields. Do NOT rename property names. Use empty strings or empty arrays when data is unavailable.
Think about which PRODUCTS and TRADE ROUTES are affected — do not leave these empty if the news mentions commodities or shipping.

News Items:
${JSON.stringify(newsData, null, 2)}
`;

  try {
    const rawResponse = await callGroq(
      "You are a strict JSON data extractor specializing in supply chain intelligence.",
      prompt,
      "llama-3.1-8b-instant",
      2048,
    );
    const { normalized } = parseAndNormalizeLLMResponse(
      rawResponse,
      "news_facts",
      "preprocessingService",
    );
    const result = normalized as { news_facts: NewsFact[] };
    return (result.news_facts ?? []).map(sanitizeNewsFact);
  } catch (error) {
    console.error(
      "[preprocessingService] Failed to extract news facts:",
      error,
    );
    return [];
  }
}

/**
 * Heuristically converts Military raw data to structured facts.
 */
function extractMilitaryFacts(
  militaryData: Record<string, unknown> | null | undefined,
): MilitaryFact[] {
  if (!militaryData) return [];
  const facts: MilitaryFact[] = [];

  const count =
    typeof militaryData.count === "number" ? militaryData.count : 0;
  const mockData =
    typeof militaryData.mockData === "string" ? militaryData.mockData : "";

  if (count > 0) {
    facts.push({
      aircraft: "Military Logistics Aircraft",
      country: "Multiple",
      region: "Middle East / Indian Ocean",
      observation: `Detected ${count} active military or logistics aircraft in the monitored region.`,
      operational_relevance:
        "Elevated military logistics may correlate with geopolitical shifts affecting nearby trade corridors.",
    });
  }

  if (mockData) {
    facts.push({
      aircraft: "Mixed Military Logistics",
      country: "Unknown",
      region: "Red Sea / Arabian Sea",
      observation: mockData
        .replace(
          "MOCK MILITARY AVIATION INTELLIGENCE (Credentials missing or API failed):\n",
          "",
        )
        .trim(),
      operational_relevance:
        "Military activity near trade corridors is one signal; significance depends on corroboration with other intelligence sources.",
    });
  }

  return facts;
}

/**
 * Heuristically converts Maritime raw data to structured facts.
 */
function extractMaritimeFacts(
  maritimeData: Record<string, unknown> | null | undefined,
): MaritimeFact[] {
  if (!maritimeData) return [];
  const facts: MaritimeFact[] = [];

  const shipTypes =
    (maritimeData.shipTypes as Record<string, number>) || {};
  const mockData =
    typeof maritimeData.mockData === "string" ? maritimeData.mockData : "";

  const tankers = (shipTypes.Tanker || 0) + (shipTypes.Cargo || 0);

  if (tankers > 5) {
    facts.push({
      event: "High Commercial Vessel Concentration",
      route: "Major Chokepoints",
      vessel_type: "Tanker / Cargo",
      observation: `Detected ${tankers} commercial cargo and tanker vessels operating in monitored zones.`,
      operational_relevance:
        "High traffic concentration at chokepoints increases vulnerability to closures and may signal congestion or rerouting.",
    });
  }

  if (mockData) {
    facts.push({
      event: "Route Deviations & Congestion",
      route: "Red Sea / Singapore",
      vessel_type: "Container / Tanker",
      observation: mockData
        .replace(
          "MOCK MARITIME INTELLIGENCE (No AIS data or no key):\n",
          "",
        )
        .trim(),
      operational_relevance:
        "Route deviations directly impact transit times and logistics costs for Indian imports.",
    });
  }

  return facts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge-Graph-Aware Priority Assignment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assigns priority based on how the observation connects to the knowledge graph.
 * If it mentions entities with Critical strategic weight connections, it gets higher priority.
 * This replaces the old hardcoded CRITICAL_KEYWORDS / HIGH_KEYWORDS approach.
 */
function assignPriority(
  kgResult: KnowledgeGraphResult,
  observationText: string,
): PrioritizationMetadata {
  const matchCount = kgResult.matched_entities.length;
  const exposure = kgResult.supply_chain_exposure;

  // Determine priority by what the graph trace found
  const hasCriticalInfra = exposure.critical_infrastructure.length > 0;
  const hasAffectedPorts = exposure.affected_ports.length > 0;
  const hasAffectedProducts = exposure.affected_products.length > 0;
  const hasCorridors = exposure.affected_corridors.length > 0;
  const hasAlternatives = exposure.alternative_suppliers.length > 0;

  let level: PrioritizationMetadata["priority_level"] = "BACKGROUND";

  if (matchCount >= 4 && hasCriticalInfra && hasCorridors) {
    level = "CRITICAL";
  } else if (matchCount >= 3 && (hasAffectedPorts || hasCriticalInfra)) {
    level = "CRITICAL";
  } else if (matchCount >= 2 && hasAffectedProducts) {
    level = "HIGH";
  } else if (matchCount >= 1 && (hasCorridors || hasAffectedProducts)) {
    level = "MEDIUM";
  } else if (matchCount >= 1) {
    level = "LOW";
  }

  // Determine business context
  let businessCriticality = "Indirect or long-term impact";
  if (level === "CRITICAL" || level === "HIGH") {
    const affectedItems = [
      ...exposure.affected_products.map((p) => p.product),
      ...exposure.affected_corridors.map((c) => c.corridor),
    ].slice(0, 3);
    businessCriticality = affectedItems.length > 0
      ? `Direct impact on: ${affectedItems.join(", ")}`
      : "Direct impact on Indian import continuity";
  }

  return {
    priority_level: level,
    business_criticality: businessCriticality,
    strategic_importance:
      level === "CRITICAL"
        ? "National Security / Core Economic Concern"
        : level === "HIGH"
          ? "Major Sector Impact"
          : "Sector-specific concern",
    time_horizon:
      level === "CRITICAL"
        ? "Immediate to Short-Term (0-3 months)"
        : level === "HIGH"
          ? "Short to Medium-Term (1-6 months)"
          : "Medium to Long-Term",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-Source Correlation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks if military/maritime observations mention regions overlapping with
 * news events. If so, boosts the priority of corroborated observations.
 */
function applyCorroborationBoost(
  augmented: AugmentedObservation[],
): void {
  // Collect region keywords from each observation type
  const newsRegions = new Set<string>();
  const militaryRegions = new Set<string>();
  const maritimeRegions = new Set<string>();

  for (const obs of augmented) {
    const text = JSON.stringify(obs.fact).toLowerCase();
    const keywords = extractRegionKeywords(text);
    if (obs.type === "News") keywords.forEach((k) => newsRegions.add(k));
    if (obs.type === "Military") keywords.forEach((k) => militaryRegions.add(k));
    if (obs.type === "Maritime") keywords.forEach((k) => maritimeRegions.add(k));
  }

  // Boost observations whose regions are corroborated by another source type
  for (const obs of augmented) {
    if (!obs.prioritization) continue;
    const text = JSON.stringify(obs.fact).toLowerCase();
    const keywords = extractRegionKeywords(text);

    let corroborated = false;
    for (const kw of keywords) {
      if (obs.type === "News" && (militaryRegions.has(kw) || maritimeRegions.has(kw))) {
        corroborated = true;
      } else if (obs.type === "Military" && (newsRegions.has(kw) || maritimeRegions.has(kw))) {
        corroborated = true;
      } else if (obs.type === "Maritime" && (newsRegions.has(kw) || militaryRegions.has(kw))) {
        corroborated = true;
      }
    }

    if (corroborated && obs.prioritization.priority_level !== "CRITICAL") {
      // Boost by one level
      const currentLevel = obs.prioritization.priority_level;
      if (currentLevel === "BACKGROUND") obs.prioritization.priority_level = "LOW";
      else if (currentLevel === "LOW") obs.prioritization.priority_level = "MEDIUM";
      else if (currentLevel === "MEDIUM") obs.prioritization.priority_level = "HIGH";
      else if (currentLevel === "HIGH") obs.prioritization.priority_level = "CRITICAL";

      obs.prioritization.business_criticality += " [Multi-source corroborated]";
    }
  }
}

const REGION_KEYWORDS = [
  "hormuz", "red sea", "bab-el-mandeb", "suez", "malacca",
  "south china sea", "black sea", "panama", "middle east",
  "persian gulf", "arabian sea", "indian ocean", "singapore",
  "china", "russia", "iran", "ukraine", "taiwan",
];

function extractRegionKeywords(text: string): string[] {
  return REGION_KEYWORDS.filter((kw) => text.includes(kw));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Pipeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Augments facts with Knowledge Graph context, assigns graph-aware priority,
 * applies cross-source correlation boost, and filters to top observations.
 */
export async function preprocessIntelligence(
  sources: DataSourceOutput[],
): Promise<AugmentedObservation[]> {
  console.log(
    "[preprocessingService] Starting Fact Extraction & Prioritization...",
  );

  const newsSource = sources.find((s) => s.source === "NewsAPI");
  const militarySource = sources.find((s) => s.source.includes("OpenSky"));
  const maritimeSource = sources.find((s) => s.source.includes("AIS"));

  const [newsFacts, militaryFacts, maritimeFacts] = await Promise.all([
    extractNewsFacts((newsSource?.data as unknown[]) || []),
    Promise.resolve(
      extractMilitaryFacts(
        militarySource?.data as Record<string, unknown> | null | undefined,
      ),
    ),
    Promise.resolve(
      extractMaritimeFacts(
        maritimeSource?.data as Record<string, unknown> | null | undefined,
      ),
    ),
  ]);

  const augmented: AugmentedObservation[] = [];

  // Augment & Prioritize News — each observation gets its own KG analysis
  for (const fact of newsFacts) {
    const contextStr =
      safeJoin(fact.keywords) +
      " " +
      safeJoin(fact.affected_products) +
      " " +
      safeJoin(fact.affected_trade_routes) +
      " " +
      fact.event +
      " " +
      fact.country +
      " " +
      fact.region;

    const kgResult = buildKnowledgeGraphContext([
      { source: "Extraction", data: contextStr },
    ]);
    const priority = assignPriority(kgResult, contextStr);
    augmented.push({
      type: "News",
      fact,
      knowledge_graph_context: kgResult.strategic_context_summary,
      prioritization: priority,
    });
  }

  // Augment & Prioritize Military
  for (const fact of militaryFacts) {
    const contextStr = `${fact.observation} ${fact.region} ${fact.country} ${fact.aircraft}`;
    const kgResult = buildKnowledgeGraphContext([
      { source: "Extraction", data: contextStr },
    ]);
    const priority = assignPriority(kgResult, contextStr);
    // Military gets minimum LOW (never BACKGROUND) since any military activity has baseline relevance
    if (priority.priority_level === "BACKGROUND")
      priority.priority_level = "LOW";
    augmented.push({
      type: "Military",
      fact,
      knowledge_graph_context: kgResult.strategic_context_summary,
      prioritization: priority,
    });
  }

  // Augment & Prioritize Maritime
  for (const fact of maritimeFacts) {
    const contextStr = `${fact.observation} ${fact.route} ${fact.event} ${fact.vessel_type}`;
    const kgResult = buildKnowledgeGraphContext([
      { source: "Extraction", data: contextStr },
    ]);
    const priority = assignPriority(kgResult, contextStr);
    // Maritime gets minimum LOW
    if (priority.priority_level === "BACKGROUND")
      priority.priority_level = "LOW";
    augmented.push({
      type: "Maritime",
      fact,
      knowledge_graph_context: kgResult.strategic_context_summary,
      prioritization: priority,
    });
  }

  // Apply cross-source correlation boost
  applyCorroborationBoost(augmented);

  console.log(
    `[preprocessingService] Extracted, Augmented & Prioritized ${augmented.length} total facts.`,
  );

  // Relevance Filter: Sort by priority, then by corroboration
  const priorityScore = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    BACKGROUND: 0,
  };

  augmented.sort((a, b) => {
    const scoreA =
      priorityScore[a.prioritization?.priority_level || "BACKGROUND"];
    const scoreB =
      priorityScore[b.prioritization?.priority_level || "BACKGROUND"];
    if (scoreA !== scoreB) return scoreB - scoreA;

    // Tie breaker: corroborated observations rank higher
    const aCorroborated = a.prioritization?.business_criticality?.includes("corroborated") ? 1 : 0;
    const bCorroborated = b.prioritization?.business_criticality?.includes("corroborated") ? 1 : 0;
    if (aCorroborated !== bCorroborated) return bCorroborated - aCorroborated;

    // Second tie breaker: KG context richness
    const aHasContext = a.knowledge_graph_context.length > 20 ? 1 : 0;
    const bHasContext = b.knowledge_graph_context.length > 20 ? 1 : 0;
    return bHasContext - aHasContext;
  });

  // Limit Context to Top 15 Observations
  const finalSet = augmented.slice(0, 15);
  console.log(
    `[preprocessingService] Prioritization complete. Kept top ${finalSet.length} critical facts.`,
  );

  return finalSet;
}
