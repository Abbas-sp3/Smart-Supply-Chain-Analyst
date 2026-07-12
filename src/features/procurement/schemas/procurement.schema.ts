import { z } from "zod";

const sourceArticleSchema = z
  .object({
    title: z.string(),
    url: z.string(),
  })
  .nullable();

const alternativeSchema = z.object({
  option_number: z.number().int().min(1).max(3),
  source: z.string(),
  commodity: z.string(),
  tier: z.enum(["recommended", "viable", "caution"]),
  summary: z.string(),
  detail: z.array(z.string()).min(1),
  compatibility: z.string(),
  diplomatic_perspective: z.array(z.string()).min(1),
  source_article: sourceArticleSchema,
});

export const energyBriefingSchema = z.object({
  executive_summary: z.string(),
  historical_comparison: z.string().optional().default(""),
  alternatives: z.array(alternativeSchema).min(1).max(3),
  disclaimer: z.string().optional().default(
    "This briefing supports energy procurement decisions; it does not replace formal trade-policy or MEA review.",
  ),
});

export type EnergyBriefingFromSchema = z.infer<
  typeof energyBriefingSchema
>;
