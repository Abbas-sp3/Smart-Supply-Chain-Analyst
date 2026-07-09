/**
 * Compact Intelligence Context — fed to Groq modules.
 * Never includes raw API payloads, articles, or large JSON blobs.
 */

export type CompactCriticalEvent = {
  event: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "BACKGROUND";
  country?: string;
  region?: string;
  products?: string[];
  routes?: string[];
};

export type CompactMilitaryObservation = {
  activity: string;
  region: string;
  relevance: string;
};

export type CompactMaritimeObservation = {
  event: string;
  route: string;
  relevance: string;
};

export type CompactKnowledgeGraphEntry = {
  entity: string;
  relationship: string;
  dependency: string;
};

export type IntelligenceContext = {
  critical_events: CompactCriticalEvent[];
  military_observations: CompactMilitaryObservation[];
  maritime_observations: CompactMaritimeObservation[];
  knowledge_graph_context: CompactKnowledgeGraphEntry[];
};
