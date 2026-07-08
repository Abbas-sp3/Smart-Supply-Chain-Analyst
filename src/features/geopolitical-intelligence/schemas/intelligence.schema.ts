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
const keyDevelopmentSchema = z.object({
  title: z.string(),
  description: z.string(),
  importance: z.string(),
  why_it_matters: z.string(),
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

// ---------------------------------------------------------------------------
// Top-level schema
// ---------------------------------------------------------------------------
export const intelligenceReportSchema = z.object({
  executive_summary: z.string(),
  key_developments: z.array(keyDevelopmentSchema),
  affected_import_categories: z.array(affectedImportCategorySchema),
  affected_products: z.array(affectedProductSchema),
  affected_trade_corridors: z.array(affectedTradeCorridorSchema),
  affected_ports: z.array(affectedPortSchema),
  affected_countries: z.array(affectedCountrySchema),
  affected_industries: z.array(affectedIndustrySchema),
  possible_supply_chain_impacts: z.array(supplyChainImpactSchema),
  alternative_supply_options: z.array(alternativeSupplyOptionSchema),
  recommendations: z.array(recommendationSchema),
  why_india_should_care: z.string(),
  supporting_evidence: z.array(supportingEvidenceSchema),
});

export type IntelligenceReportFromSchema = z.infer<
  typeof intelligenceReportSchema
>;
