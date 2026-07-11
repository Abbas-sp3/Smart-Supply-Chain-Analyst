/**
 * Builds an enriched IntelligenceContext from preprocessed observations.
 *
 * Enrichments over the old version:
 *  1. Calls traceSupplyChainImpact() to produce deterministic supply chain exposure
 *  2. Fuses evidence across observation types to detect corroboration
 *  3. Includes strategic context summary from the knowledge graph
 */

import type {
  AugmentedObservation,
  NewsFact,
  MilitaryFact,
  MaritimeFact,
  DataSourceOutput,
} from "../types";
import type {
  IntelligenceContext,
  CompactCriticalEvent,
  CompactMilitaryObservation,
  CompactMaritimeObservation,
  CompactKnowledgeGraphEntry,
  EvidenceSignal,
} from "../types/intelligence-context";
import {
  buildKnowledgeGraphContext,
  type KnowledgeGraphResult,
} from "../knowledge-graph";

// ─────────────────────────────────────────────────────────────────────────────
// Observation → Compact converters
// ─────────────────────────────────────────────────────────────────────────────

function newsToCriticalEvent(
  fact: NewsFact,
  priority: CompactCriticalEvent["priority"],
): CompactCriticalEvent {
  return {
    event: fact.event,
    priority,
    country: fact.country,
    region: fact.region,
    products: fact.affected_products.slice(0, 5),
    routes: fact.affected_trade_routes.slice(0, 5),
  };
}

function militaryToCompact(fact: MilitaryFact): CompactMilitaryObservation {
  return {
    activity: fact.observation,
    region: fact.region,
    relevance: fact.operational_relevance,
  };
}

function maritimeToCompact(fact: MaritimeFact): CompactMaritimeObservation {
  return {
    event: fact.event,
    route: fact.route,
    relevance: fact.operational_relevance,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Fusion — detect cross-source corroboration
// ─────────────────────────────────────────────────────────────────────────────

/** Regions/keywords that appear across multiple intelligence sources */
function fuseEvidence(
  newsEvents: CompactCriticalEvent[],
  militaryObs: CompactMilitaryObservation[],
  maritimeObs: CompactMaritimeObservation[],
): EvidenceSignal[] {
  const signals: EvidenceSignal[] = [];

  // Build keyword sets per source
  const newsKeywords = new Set<string>();
  for (const event of newsEvents) {
    const words = `${event.event} ${event.country ?? ""} ${event.region ?? ""} ${(event.products ?? []).join(" ")} ${(event.routes ?? []).join(" ")}`.toLowerCase();
    for (const kw of extractFusionKeywords(words)) {
      newsKeywords.add(kw);
    }
  }

  const militaryKeywords = new Set<string>();
  for (const obs of militaryObs) {
    const words = `${obs.activity} ${obs.region} ${obs.relevance}`.toLowerCase();
    for (const kw of extractFusionKeywords(words)) {
      militaryKeywords.add(kw);
    }
  }

  const maritimeKeywords = new Set<string>();
  for (const obs of maritimeObs) {
    const words = `${obs.event} ${obs.route} ${obs.relevance}`.toLowerCase();
    for (const kw of extractFusionKeywords(words)) {
      maritimeKeywords.add(kw);
    }
  }

  // Find keywords that appear in 2+ sources
  const allKeywords = new Set([...newsKeywords, ...militaryKeywords, ...maritimeKeywords]);

  for (const kw of allKeywords) {
    const sources: string[] = [];
    if (newsKeywords.has(kw)) sources.push("News & Events");
    if (militaryKeywords.has(kw)) sources.push("Military Aviation Intelligence");
    if (maritimeKeywords.has(kw)) sources.push("Maritime AIS Intelligence");

    if (sources.length >= 2) {
      const confidence = sources.length >= 3 ? "Strong" : "Moderate";
      const label = FUSION_KEYWORD_LABELS[kw] ?? kw;
      // Avoid duplicate signals for the same label
      if (!signals.some((s) => s.signal === label)) {
        signals.push({
          signal: `${label} — corroborated across ${sources.length} intelligence sources`,
          corroborating_sources: sources,
          confidence,
        });
      }
    }
  }

  // If no cross-source corroboration found, note it
  if (signals.length === 0 && newsEvents.length > 0) {
    signals.push({
      signal: "Single-source intelligence — no cross-source corroboration detected",
      corroborating_sources: ["News & Events"],
      confidence: "Weak",
    });
  }

  return signals.slice(0, 6);
}

/** Strategic keywords to look for when fusing evidence across sources */
const FUSION_KEYWORDS = [
  "hormuz", "red sea", "bab-el-mandeb", "suez", "malacca",
  "south china sea", "black sea", "panama",
  "middle east", "persian gulf", "arabian sea", "indian ocean",
  "oil", "crude", "lng", "gas", "coal", "tanker",
  "shipping", "container", "port", "congestion", "reroute",
  "sanctions", "embargo", "tariff", "export control", "restriction",
  "military", "naval", "warship", "aircraft",
  "houthi", "iran", "china", "russia", "ukraine",
  "disruption", "shortage", "delay",
];

const FUSION_KEYWORD_LABELS: Record<string, string> = {
  "hormuz": "Strait of Hormuz activity",
  "red sea": "Red Sea disruption",
  "bab-el-mandeb": "Bab-el-Mandeb corridor risk",
  "suez": "Suez Canal impact",
  "malacca": "Strait of Malacca activity",
  "south china sea": "South China Sea tensions",
  "black sea": "Black Sea corridor disruption",
  "panama": "Panama Canal constraints",
  "middle east": "Middle East instability",
  "persian gulf": "Persian Gulf tensions",
  "arabian sea": "Arabian Sea activity",
  "indian ocean": "Indian Ocean activity",
  "oil": "Oil supply disruption",
  "crude": "Crude oil supply risk",
  "lng": "LNG supply concern",
  "gas": "Natural gas supply",
  "coal": "Coal supply disruption",
  "tanker": "Tanker movement anomaly",
  "shipping": "Shipping disruption",
  "container": "Container logistics impact",
  "congestion": "Port/route congestion",
  "reroute": "Trade route rerouting",
  "sanctions": "Sanctions impact",
  "embargo": "Trade embargo",
  "tariff": "Tariff impact",
  "export control": "Export control restriction",
  "restriction": "Trade restriction",
  "military": "Military activity",
  "naval": "Naval activity",
  "houthi": "Houthi threat activity",
  "iran": "Iran-related risk",
  "china": "China-related supply risk",
  "russia": "Russia-related supply risk",
  "ukraine": "Ukraine conflict impact",
  "disruption": "Supply chain disruption",
  "shortage": "Supply shortage",
  "delay": "Transit/delivery delay",
};

function extractFusionKeywords(text: string): string[] {
  return FUSION_KEYWORDS.filter((kw) => text.includes(kw));
}

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Graph context parsing (legacy format support)
// ─────────────────────────────────────────────────────────────────────────────

function parseKnowledgeGraphEntries(kgContext: string): CompactKnowledgeGraphEntry[] {
  if (!kgContext || kgContext.length < 10) return [];

  const entries: CompactKnowledgeGraphEntry[] = [];
  const lines = kgContext
    .split("\n")
    .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("->"));

  let currentEntity = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      const match = trimmed.match(/^- (.+?) \(/);
      currentEntity = match?.[1] ?? trimmed.slice(2, 60);
      const descMatch = trimmed.match(/: (.+)$/);
      if (descMatch) {
        entries.push({
          entity: currentEntity,
          relationship: "depends_on",
          dependency: descMatch[1].slice(0, 120),
        });
      }
    } else if (trimmed.startsWith("->") && currentEntity) {
      const relMatch = trimmed.match(/\] (.+)$/);
      if (relMatch) {
        entries.push({
          entity: currentEntity,
          relationship: "linked_to",
          dependency: relMatch[1].slice(0, 120),
        });
      }
    }
  }

  return entries.slice(0, 8);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts augmented observations into an enriched context object
 * suitable for all Groq reasoning modules.
 *
 * Enrichments:
 *  - Deterministic supply chain exposure from knowledge graph BFS tracing
 *  - Cross-source evidence fusion signals
 *  - Strategic context summary
 */
export function buildIntelligenceContext(
  observations: AugmentedObservation[],
  rawSources?: DataSourceOutput[],
): IntelligenceContext {
  const critical_events: CompactCriticalEvent[] = [];
  const military_observations: CompactMilitaryObservation[] = [];
  const maritime_observations: CompactMaritimeObservation[] = [];
  const kgSet = new Map<string, CompactKnowledgeGraphEntry>();

  for (const obs of observations) {
    const priority = obs.prioritization?.priority_level ?? "BACKGROUND";

    if (obs.type === "News") {
      critical_events.push(newsToCriticalEvent(obs.fact as NewsFact, priority));
    } else if (obs.type === "Military") {
      military_observations.push(militaryToCompact(obs.fact as MilitaryFact));
    } else if (obs.type === "Maritime") {
      maritime_observations.push(maritimeToCompact(obs.fact as MaritimeFact));
    }

    for (const entry of parseKnowledgeGraphEntries(obs.knowledge_graph_context)) {
      const key = `${entry.entity}:${entry.dependency}`;
      if (!kgSet.has(key)) kgSet.set(key, entry);
    }
  }

  // --- Knowledge Graph Tracing ---
  // Build synthetic sources from observations for entity matching
  const kgSources: DataSourceOutput[] = rawSources ?? observations.map((obs) => ({
    source: obs.type,
    data: obs.fact,
  }));

  const kgResult: KnowledgeGraphResult = buildKnowledgeGraphContext(kgSources);

  // --- Evidence Fusion ---
  const evidenceSignals = fuseEvidence(
    critical_events,
    military_observations,
    maritime_observations,
  );

  return {
    critical_events: critical_events.slice(0, 12),
    military_observations: military_observations.slice(0, 6),
    maritime_observations: maritime_observations.slice(0, 6),
    knowledge_graph_context: Array.from(kgSet.values()).slice(0, 8),
    supply_chain_exposure: kgResult.supply_chain_exposure,
    evidence_signals: evidenceSignals,
    strategic_summary: kgResult.strategic_context_summary,
  };
}

/** Stable hash for scenario module invalidation when intelligence changes */
export function hashIntelligenceContext(ctx: IntelligenceContext): string {
  const payload = JSON.stringify({
    events: ctx.critical_events.map((e) => `${e.priority}:${e.event}`),
    military: ctx.military_observations.length,
    maritime: ctx.maritime_observations.length,
    exposure: ctx.supply_chain_exposure.affected_products.length,
    signals: ctx.evidence_signals.length,
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
