/**
 * Zod schemas for independent intelligence module outputs.
 */

import { z } from "zod";

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

const supplyChainFactSchema = z.object({
  entity_type: z.enum([
    "country",
    "product",
    "port",
    "corridor",
    "industry",
    "category",
    "infrastructure",
  ]),
  entity: z.string(),
  risk: z.string(),
  related_entities: z.array(z.string()).optional().default([]),
});

const supplyChainImpactSchema = z.object({
  impact: z.string(),
  reason: z.string(),
});

const recommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.string(),
  reason: z.string(),
});

const alternativeSupplyOptionSchema = z.object({
  product: z.string(),
  current_source: z.string(),
  alternative_sources: z.array(z.string()),
  reason: z.string(),
});

const monitoringPrioritySchema = z.object({
  priority: z.string(),
  reason: z.string(),
});

const scenarioCaseSchema = z.object({
  description: z.string(),
  impact_on_india: z.string(),
});

const historicalEventSchema = z.object({
  event: z.string(),
  relevance: z.string(),
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

export const executiveSummaryModuleSchema = z.object({
  executive_summary: z.string(),
  current_operational_assessment: operationalAssessmentSchema,
  key_developments: z.array(keyDevelopmentSchema).optional().default([]),
  intelligence_observations: z
    .array(intelligenceObservationSchema)
    .optional()
    .default([]),
  why_india_should_care: z.string(),
});

export const supplyChainImpactModuleSchema = z.object({
  facts: z.array(supplyChainFactSchema).optional().default([]),
  supply_chain_impacts: z
    .array(supplyChainImpactSchema)
    .optional()
    .default([]),
});

export const recommendationsModuleSchema = z.object({
  recommendations: z.array(recommendationSchema).optional().default([]),
  alternative_supply_options: z
    .array(alternativeSupplyOptionSchema)
    .optional()
    .default([]),
  monitoring_priorities: z
    .array(monitoringPrioritySchema)
    .optional()
    .default([]),
});

export const scenarioAnalysisModuleSchema = z.object({
  scenario_analysis: z.object({
    best_case: scenarioCaseSchema,
    most_likely: scenarioCaseSchema,
    worst_case: scenarioCaseSchema,
  }),
  historical_similar_events: z
    .array(historicalEventSchema)
    .optional()
    .default([]),
});

export const evidenceModuleSchema = z.object({
  supporting_evidence: z
    .array(supportingEvidenceSchema)
    .optional()
    .default([]),
  military_observations: z
    .array(militaryObservationSchema)
    .optional()
    .default([]),
  maritime_observations: z
    .array(maritimeObservationSchema)
    .optional()
    .default([]),
});
