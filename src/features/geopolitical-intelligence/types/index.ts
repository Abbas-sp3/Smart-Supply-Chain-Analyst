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
export type KeyDevelopment = {
  title: string;
  description: string;
  importance: string;
  why_it_matters: string;
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

// ---------------------------------------------------------------------------
// Top-level report — what intelligenceService returns, what the API serves,
// and what the frontend renders
// ---------------------------------------------------------------------------
export type IntelligenceReport = {
  executive_summary: string;
  key_developments: KeyDevelopment[];
  affected_import_categories: AffectedImportCategory[];
  affected_products: AffectedProduct[];
  affected_trade_corridors: AffectedTradeCorridor[];
  affected_ports: AffectedPort[];
  affected_countries: AffectedCountry[];
  affected_industries: AffectedIndustry[];
  possible_supply_chain_impacts: SupplyChainImpact[];
  alternative_supply_options: AlternativeSupplyOption[];
  recommendations: Recommendation[];
  why_india_should_care: string;
  supporting_evidence: SupportingEvidence[];
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
export type DataSourceOutput = {
  /** Human-readable label for this data source (e.g. "NewsAPI", "AIS Vessel Tracking") */
  source: string;
  /** Text content ready to be injected into the AI prompt */
  content: string;
};

export interface DataSourcePlugin {
  readonly name: string;
  fetch(): Promise<DataSourceOutput[]>;
}
