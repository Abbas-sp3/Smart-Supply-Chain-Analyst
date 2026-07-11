/**
 * Compact Intelligence Context — fed to Groq modules.
 * Never includes raw API payloads, articles, or large JSON blobs.
 *
 * Enriched with:
 *  - supply_chain_exposure: deterministic output from knowledge graph tracing
 *  - evidence_signals: cross-source corroboration indicators
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

/** Pre-computed deterministic supply chain exposure from the knowledge graph */
export type SupplyChainExposureContext = {
  affected_countries: Array<{ country: string; reason: string }>;
  affected_products: Array<{ product: string; reason: string }>;
  affected_import_categories: Array<{ category: string; reason: string }>;
  affected_ports: Array<{ port: string; reason: string }>;
  affected_industries: Array<{ industry: string; reason: string }>;
  affected_corridors: Array<{ corridor: string; reason: string }>;
  critical_infrastructure: Array<{ infrastructure: string; risk: string }>;
  alternative_suppliers: Array<{
    product: string;
    current_source: string;
    alternative_sources: string[];
    reason: string;
  }>;
};

/** Cross-source evidence corroboration */
export type EvidenceSignal = {
  signal: string;
  corroborating_sources: string[];
  confidence: "Strong" | "Moderate" | "Weak";
};

export type IntelligenceContext = {
  critical_events: CompactCriticalEvent[];
  military_observations: CompactMilitaryObservation[];
  maritime_observations: CompactMaritimeObservation[];
  knowledge_graph_context: CompactKnowledgeGraphEntry[];
  /** Deterministic supply chain exposure from knowledge graph tracing */
  supply_chain_exposure: SupplyChainExposureContext;
  /** Cross-source corroborated evidence */
  evidence_signals: EvidenceSignal[];
  /** Brief strategic context summary from knowledge graph */
  strategic_summary: string;
};
