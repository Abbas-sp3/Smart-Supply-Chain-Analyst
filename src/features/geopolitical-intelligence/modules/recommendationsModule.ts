import type { IntelligenceContext } from "../types/intelligence-context";
import type { RecommendationsModuleOutput } from "../types/module-outputs";
import { recommendationsModuleSchema } from "../schemas/module-schemas";
import {
  buildSystemPrompt,
  buildRecommendationsUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";
import type { CountryProfile } from "@/data/countries/types";

export async function runRecommendationsModule(
  ctx: IntelligenceContext,
  country: CountryProfile,
): Promise<RecommendationsModuleOutput> {
  return runIntelligenceModule(
    "recommendations",
    buildSystemPrompt(country, "recommendations"),
    buildRecommendationsUserPrompt(ctx, country),
    recommendationsModuleSchema,
    country.id,
  );
}
