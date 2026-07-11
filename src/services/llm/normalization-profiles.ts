/**
 * Default value templates for LLM response normalization.
 * Shapes mirror Zod schemas — used to fill missing fields before validation.
 */

export type NormalizationProfileId =
  | "executive_summary"
  | "supply_chain_impact"
  | "recommendations"
  | "scenario_analysis"
  | "evidence"
  | "intelligence_report"
  | "procurement_briefing"
  | "news_facts";

type ProfileConfig = {
  defaults: Record<string, unknown>;
};

const EXECUTIVE_SUMMARY_DEFAULTS = {
  executive_summary: "",
  current_operational_assessment: {
    threat_level: "Medium",
    summary: "",
  },
  key_developments: [] as unknown[],
  intelligence_observations: [] as unknown[],
  why_india_should_care: "",
};

const SUPPLY_CHAIN_IMPACT_DEFAULTS = {
  facts: [] as unknown[],
  supply_chain_impacts: [] as unknown[],
};

const RECOMMENDATIONS_DEFAULTS = {
  recommendations: [] as unknown[],
  alternative_supply_options: [] as unknown[],
  monitoring_priorities: [] as unknown[],
};

const SCENARIO_ANALYSIS_DEFAULTS = {
  scenario_analysis: {
    best_case: { description: "", impact_on_india: "" },
    most_likely: { description: "", impact_on_india: "" },
    worst_case: { description: "", impact_on_india: "" },
  },
  historical_similar_events: [] as unknown[],
};

const EVIDENCE_DEFAULTS = {
  supporting_evidence: [] as unknown[],
  military_observations: [] as unknown[],
  maritime_observations: [] as unknown[],
};

const INTELLIGENCE_REPORT_DEFAULTS = {
  executive_summary: "",
  current_operational_assessment: {
    threat_level: "Medium",
    summary: "",
  },
  key_developments: [] as unknown[],
  intelligence_observations: [] as unknown[],
  affected_import_categories: [] as unknown[],
  affected_products: [] as unknown[],
  affected_countries: [] as unknown[],
  affected_ports: [] as unknown[],
  affected_trade_corridors: [] as unknown[],
  affected_industries: [] as unknown[],
  critical_infrastructure_at_risk: [] as unknown[],
  possible_supply_chain_impacts: [] as unknown[],
  alternative_supply_options: [] as unknown[],
  recommendations: [] as unknown[],
  why_india_should_care: "",
  supporting_evidence: [] as unknown[],
  military_observations: [] as unknown[],
  maritime_observations: [] as unknown[],
  historical_similar_events: [] as unknown[],
  scenario_analysis: {
    best_case: { description: "", impact_on_india: "" },
    most_likely: { description: "", impact_on_india: "" },
    worst_case: { description: "", impact_on_india: "" },
  },
  monitoring_priorities: [] as unknown[],
};

const PROCUREMENT_BRIEFING_DEFAULTS = {
  executive_summary: "",
  historical_comparison: "",
  alternatives: [] as unknown[],
  critical_cargo: null,
  disclaimer:
    "This briefing supports procurement decisions; it does not replace formal trade-policy or MEA review.",
};

const NEWS_FACTS_DEFAULTS = {
  news_facts: [] as unknown[],
};

/** Array item templates keyed by parent field name */
export const ARRAY_ITEM_TEMPLATES: Record<string, Record<string, unknown>> = {
  key_developments: {
    title: "",
    description: "",
    importance: "Medium",
    why_it_matters: "",
  },
  intelligence_observations: { observation: "", significance: "" },
  facts: {
    entity_type: "product",
    entity: "",
    risk: "",
    related_entities: [] as string[],
  },
  supply_chain_impacts: { impact: "", reason: "" },
  recommendations: {
    title: "",
    description: "",
    priority: "Medium",
    reason: "",
  },
  alternative_supply_options: {
    product: "",
    current_source: "",
    alternative_sources: [] as string[],
    reason: "",
  },
  monitoring_priorities: { priority: "", reason: "" },
  historical_similar_events: { event: "", relevance: "" },
  supporting_evidence: { source: "", headline: "" },
  military_observations: { activity: "", implication: "" },
  maritime_observations: { anomaly: "", impact: "" },
  affected_import_categories: { category: "", reason: "" },
  affected_products: { product: "", reason: "" },
  affected_countries: { country: "", reason: "" },
  affected_ports: { port: "", reason: "" },
  affected_trade_corridors: { corridor: "", reason: "" },
  affected_industries: { industry: "", reason: "" },
  critical_infrastructure_at_risk: { infrastructure: "", risk: "" },
  possible_supply_chain_impacts: { impact: "", reason: "" },
  alternatives: {
    option_number: 1,
    source: "",
    tier: "viable",
    summary: "",
    detail: [] as string[],
    refinery_compatibility: "",
    diplomatic_perspective: [] as string[],
    source_article: null,
  },
  news_facts: {
    event: "",
    country: "",
    region: "",
    category: "",
    affected_products: [] as string[],
    affected_trade_routes: [] as string[],
    keywords: [] as string[],
  },
};

export const NORMALIZATION_PROFILES: Record<
  NormalizationProfileId,
  ProfileConfig
> = {
  executive_summary: { defaults: EXECUTIVE_SUMMARY_DEFAULTS },
  supply_chain_impact: { defaults: SUPPLY_CHAIN_IMPACT_DEFAULTS },
  recommendations: { defaults: RECOMMENDATIONS_DEFAULTS },
  scenario_analysis: { defaults: SCENARIO_ANALYSIS_DEFAULTS },
  evidence: { defaults: EVIDENCE_DEFAULTS },
  intelligence_report: { defaults: INTELLIGENCE_REPORT_DEFAULTS },
  procurement_briefing: { defaults: PROCUREMENT_BRIEFING_DEFAULTS },
  news_facts: { defaults: NEWS_FACTS_DEFAULTS },
};

/** Explicit alias map — alternative LLM property names → canonical snake_case */
export const PROPERTY_ALIASES: Record<string, string> = {
  executiveSummary: "executive_summary",
  currentAssessment: "current_operational_assessment",
  currentOperationalAssessment: "current_operational_assessment",
  operationalAssessment: "current_operational_assessment",
  whyIndiaShouldCare: "why_india_should_care",
  keyDevelopments: "key_developments",
  intelligenceObservations: "intelligence_observations",
  threatLevel: "threat_level",
  whyItMatters: "why_it_matters",
  supplyChainImpacts: "supply_chain_impacts",
  alternativeSupplyOptions: "alternative_supply_options",
  monitoringPriorities: "monitoring_priorities",
  scenarioAnalysis: "scenario_analysis",
  bestCase: "best_case",
  mostLikely: "most_likely",
  worstCase: "worst_case",
  impactOnIndia: "impact_on_india",
  historicalSimilarEvents: "historical_similar_events",
  historicalComparison: "historical_comparison",
  supportingEvidence: "supporting_evidence",
  militaryObservations: "military_observations",
  maritimeObservations: "maritime_observations",
  affectedImportCategories: "affected_import_categories",
  affectedProducts: "affected_products",
  affectedCountries: "affected_countries",
  affectedPorts: "affected_ports",
  affectedTradeCorridors: "affected_trade_corridors",
  affectedIndustries: "affected_industries",
  criticalInfrastructureAtRisk: "critical_infrastructure_at_risk",
  possibleSupplyChainImpacts: "possible_supply_chain_impacts",
  criticalCargo: "critical_cargo",
  refineryCompatibility: "refinery_compatibility",
  diplomaticPerspective: "diplomatic_perspective",
  sourceArticle: "source_article",
  currentSource: "current_source",
  alternativeSources: "alternative_sources",
  entityType: "entity_type",
  relatedEntities: "related_entities",
  optionNumber: "option_number",
};

/** Enum fields coerced to valid values when LLM returns invalid/missing data */
export const ENUM_COERCIONS: Record<string, { allowed: string[]; fallback: string }> = {
  threat_level: {
    allowed: ["Critical", "High", "Medium", "Low"],
    fallback: "Medium",
  },
  tier: {
    allowed: ["recommended", "viable", "caution"],
    fallback: "viable",
  },
  entity_type: {
    allowed: [
      "country",
      "product",
      "port",
      "corridor",
      "industry",
      "category",
      "infrastructure",
    ],
    fallback: "product",
  },
};
