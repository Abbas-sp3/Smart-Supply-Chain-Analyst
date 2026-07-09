/**
 * Geopolitical Intelligence Engine — Zod Validation Schema
 *
 * Validates raw Groq JSON output before it is typed and served.
 * Only this file imports zod — all other files use the TypeScript types.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const operationalAssessmentSchema = z.object({
  threat_level: z.enum(["Critical", "High", "Medium", "Low"]),
  summary: z.string(),
});

const keyDevelopmentSchema = z.object({
  title: z.string(),
  description: z.string(),
  importance: z.string(),
  why_it_matters: z.string(),
});

const intelligenceObservationSchema = z.object({
  observation: z.string(),
  significance: z.string(),
});

const affectedImportCategorySchema = z.object({
  category: z.string(),
  reason: z.string(),
});

const affectedProductSchema = z.object({
  product: z.string(),
  reason: z.string(),
});

const affectedTradeCorridorSchema = z.object({
  corridor: z.string(),
  reason: z.string(),
});

const affectedPortSchema = z.object({
  port: z.string(),
  reason: z.string(),
});

const affectedCountrySchema = z.object({
  country: z.string(),
  reason: z.string(),
});

const affectedIndustrySchema = z.object({
  industry: z.string(),
  reason: z.string(),
});

const criticalInfrastructureRiskSchema = z.object({
  infrastructure: z.string(),
  risk: z.string(),
});

const supplyChainImpactSchema = z.object({
  impact: z.string(),
  reason: z.string(),
});

const alternativeSupplyOptionSchema = z.object({
  product: z.string(),
  current_source: z.string(),
  alternative_sources: z.array(z.string()),
  reason: z.string(),
});

const recommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.string(),
  reason: z.string(),
});

const supportingEvidenceSchema = z.object({
  source: z.string(),
  headline: z.string(),
});

const militaryObservationSchema = z.object({
  activity: z.string(),
  implication: z.string(),
});

const maritimeObservationSchema = z.object({
  anomaly: z.string(),
  impact: z.string(),
});

const historicalEventSchema = z.object({
  event: z.string(),
  relevance: z.string(),
});

const scenarioCaseSchema = z.object({
  description: z.string(),
  impact_on_india: z.string(),
});

const scenarioAnalysisSchema = z.object({
  best_case: scenarioCaseSchema,
  most_likely: scenarioCaseSchema,
  worst_case: scenarioCaseSchema,
});

const monitoringPrioritySchema = z.object({
  priority: z.string(),
  reason: z.string(),
});

// ---------------------------------------------------------------------------
// Top-level schema
// ---------------------------------------------------------------------------
export const intelligenceReportSchema = z.object({
  executive_summary: z.string(),
  current_operational_assessment: operationalAssessmentSchema,
  key_developments: z.array(keyDevelopmentSchema).optional().default([]),
  intelligence_observations: z.array(intelligenceObservationSchema).optional().default([]),
  affected_import_categories: z.array(affectedImportCategorySchema).optional().default([]),
  affected_products: z.array(affectedProductSchema).optional().default([]),
  affected_countries: z.array(affectedCountrySchema).optional().default([]),
  affected_ports: z.array(affectedPortSchema).optional().default([]),
  affected_trade_corridors: z.array(affectedTradeCorridorSchema).optional().default([]),
  affected_industries: z.array(affectedIndustrySchema).optional().default([]),
  critical_infrastructure_at_risk: z.array(criticalInfrastructureRiskSchema).optional().default([]),
  possible_supply_chain_impacts: z.array(supplyChainImpactSchema).optional().default([]),
  alternative_supply_options: z.array(alternativeSupplyOptionSchema).optional().default([]),
  recommendations: z.array(recommendationSchema).optional().default([]),
  why_india_should_care: z.string(),
  supporting_evidence: z.array(supportingEvidenceSchema).optional().default([]),
  military_observations: z.array(militaryObservationSchema).optional().default([]),
  maritime_observations: z.array(maritimeObservationSchema).optional().default([]),
  historical_similar_events: z.array(historicalEventSchema).optional().default([]),
  scenario_analysis: scenarioAnalysisSchema,
  monitoring_priorities: z.array(monitoringPrioritySchema).optional().default([]),
});

export type IntelligenceReportFromSchema = z.infer<
  typeof intelligenceReportSchema
>;
