/**
 * Builds a compact IntelligenceContext from preprocessed observations.
 * Strips raw payloads — only structured facts reach Groq modules.
 */

import type { AugmentedObservation, NewsFact, MilitaryFact, MaritimeFact } from "../types";
import type {
  IntelligenceContext,
  CompactCriticalEvent,
  CompactMilitaryObservation,
  CompactMaritimeObservation,
  CompactKnowledgeGraphEntry,
} from "../types/intelligence-context";

function parseKnowledgeGraphEntries(kgContext: string): CompactKnowledgeGraphEntry[] {
  if (!kgContext || kgContext.length < 10) return [];

  const entries: CompactKnowledgeGraphEntry[] = [];
  const lines = kgContext.split("\n").filter((l) => l.trim().startsWith("-") || l.trim().startsWith("->"));

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

/**
 * Converts augmented observations into a compact context object
 * suitable for all Groq reasoning modules.
 */
export function buildIntelligenceContext(
  observations: AugmentedObservation[],
): IntelligenceContext {
  const critical_events: CompactCriticalEvent[] = [];
  const military_observations: CompactMilitaryObservation[] = [];
  const maritime_observations: CompactMaritimeObservation[] = [];
  const kgSet = new Map<string, CompactKnowledgeGraphEntry>();

  for (const obs of observations) {
    const priority =
      obs.prioritization?.priority_level ?? "BACKGROUND";

    if (obs.type === "News") {
      critical_events.push(
        newsToCriticalEvent(obs.fact as NewsFact, priority),
      );
    } else if (obs.type === "Military") {
      military_observations.push(
        militaryToCompact(obs.fact as MilitaryFact),
      );
    } else if (obs.type === "Maritime") {
      maritime_observations.push(
        maritimeToCompact(obs.fact as MaritimeFact),
      );
    }

    for (const entry of parseKnowledgeGraphEntries(obs.knowledge_graph_context)) {
      const key = `${entry.entity}:${entry.dependency}`;
      if (!kgSet.has(key)) kgSet.set(key, entry);
    }
  }

  return {
    critical_events: critical_events.slice(0, 12),
    military_observations: military_observations.slice(0, 6),
    maritime_observations: maritime_observations.slice(0, 6),
    knowledge_graph_context: Array.from(kgSet.values()).slice(0, 8),
  };
}

/** Stable hash for scenario module invalidation when intelligence changes */
export function hashIntelligenceContext(ctx: IntelligenceContext): string {
  const payload = JSON.stringify({
    events: ctx.critical_events.map((e) => `${e.priority}:${e.event}`),
    military: ctx.military_observations.length,
    maritime: ctx.maritime_observations.length,
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
