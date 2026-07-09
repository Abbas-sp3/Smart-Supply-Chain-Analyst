/**
 * Geopolitical Intelligence Engine — Type Definitions
 *
 * These types mirror the AI JSON schema exactly.
 * Zod validation in schemas/intelligence.schema.ts uses these shapes.
 */

// ---------------------------------------------------------------------------
// Raw article produced by newsService before it reaches the AI
// ---------------------------------------------------------------------------
export type RawArticle = {
  title: string;
  source: string;
  publishedAt: string;
  content: string;
  url: string;
};

// ---------------------------------------------------------------------------
// Sub-types used inside IntelligenceReport
// ---------------------------------------------------------------------------
export type OperationalAssessment = {
  threat_level: "Critical" | "High" | "Medium" | "Low";
  summary: string;
};

export type KeyDevelopment = {
  title: string;
  description: string;
  importance: string;
  why_it_matters: string;
};

export type IntelligenceObservation = {
  observation: string;
  significance: string;
};

export type AffectedImportCategory = {
  category: string;
  reason: string;
};

export type AffectedProduct = {
  product: string;
  reason: string;
};

export type AffectedTradeCorridor = {
  corridor: string;
  reason: string;
};

export type AffectedPort = {
  port: string;
  reason: string;
};

export type AffectedCountry = {
  country: string;
  reason: string;
};

export type AffectedIndustry = {
  industry: string;
  reason: string;
};

export type CriticalInfrastructureRisk = {
  infrastructure: string;
  risk: string;
};

export type SupplyChainImpact = {
  impact: string;
  reason: string;
};

export type AlternativeSupplyOption = {
  product: string;
  current_source: string;
  alternative_sources: string[];
  reason: string;
};

export type Recommendation = {
  title: string;
  description: string;
  priority: string;
  reason: string;
};

export type SupportingEvidence = {
  source: string;
  headline: string;
};

export type MilitaryObservation = {
  activity: string;
  implication: string;
};

export type MaritimeObservation = {
  anomaly: string;
  impact: string;
};

export type HistoricalEvent = {
  event: string;
  relevance: string;
};

export type ScenarioCase = {
  description: string;
  impact_on_india: string;
};

export type ScenarioAnalysis = {
  best_case: ScenarioCase;
  most_likely: ScenarioCase;
  worst_case: ScenarioCase;
};

export type MonitoringPriority = {
  priority: string;
  reason: string;
};

// ---------------------------------------------------------------------------
// Top-level report — what intelligenceService returns, what the API serves,
// and what the frontend renders
// ---------------------------------------------------------------------------
export type IntelligenceReport = {
  executive_summary: string;
  current_operational_assessment: OperationalAssessment;
  key_developments: KeyDevelopment[];
  intelligence_observations: IntelligenceObservation[];
  affected_import_categories: AffectedImportCategory[];
  affected_products: AffectedProduct[];
  affected_countries: AffectedCountry[];
  affected_ports: AffectedPort[];
  affected_trade_corridors: AffectedTradeCorridor[];
  affected_industries: AffectedIndustry[];
  critical_infrastructure_at_risk: CriticalInfrastructureRisk[];
  possible_supply_chain_impacts: SupplyChainImpact[];
  alternative_supply_options: AlternativeSupplyOption[];
  recommendations: Recommendation[];
  why_india_should_care: string;
  supporting_evidence: SupportingEvidence[];
  military_observations: MilitaryObservation[];
  maritime_observations: MaritimeObservation[];
  historical_similar_events: HistoricalEvent[];
  scenario_analysis: ScenarioAnalysis;
  monitoring_priorities: MonitoringPriority[];
};

// ---------------------------------------------------------------------------
// API response wrapper
// ---------------------------------------------------------------------------
export type IntelligenceApiResponse =
  | { report: IntelligenceReport; error?: never; generatedAt: string }
  | { report?: never; error: string; generatedAt?: never };

// ---------------------------------------------------------------------------
// Plugin interface — allows future data sources to be plugged in without
// changing any other file. newsService is the first implementation.
// ---------------------------------------------------------------------------
/**
 * Data Sources
 */
export interface DataSourceOutput {
  source: string;
  data: unknown; // Returning raw objects for preprocessing instead of strings
}

export interface NewsFact {
  event: string;
  country: string;
  region: string;
  category: string;
  affected_products: string[];
  affected_trade_routes: string[];
  keywords: string[];
}

export interface MilitaryFact {
  aircraft: string;
  country: string;
  region: string;
  observation: string;
  operational_relevance: string;
}

export interface MaritimeFact {
  event: string;
  route: string;
  vessel_type: string;
  observation: string;
  operational_relevance: string;
}

export interface PrioritizationMetadata {
  priority_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "BACKGROUND";
  business_criticality: string;
  strategic_importance: string;
  time_horizon: string;
}

export interface AugmentedObservation {
  type: "News" | "Military" | "Maritime";
  fact: NewsFact | MilitaryFact | MaritimeFact;
  knowledge_graph_context: string;
  prioritization?: PrioritizationMetadata;
}

export interface DataSourcePlugin {
  readonly name: string;
  fetch(): Promise<DataSourceOutput[]>;
}
