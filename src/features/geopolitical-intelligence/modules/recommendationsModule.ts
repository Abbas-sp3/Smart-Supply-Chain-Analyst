import type { IntelligenceContext } from "../types/intelligence-context";
import type { RecommendationsModuleOutput } from "../types/module-outputs";
import { recommendationsModuleSchema } from "../schemas/module-schemas";
import {
  RECOMMENDATIONS_SYSTEM_PROMPT,
  buildRecommendationsUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";

export async function runRecommendationsModule(
  ctx: IntelligenceContext,
): Promise<RecommendationsModuleOutput> {
  return runIntelligenceModule(
    "recommendations",
    RECOMMENDATIONS_SYSTEM_PROMPT,
    buildRecommendationsUserPrompt(ctx),
    recommendationsModuleSchema,
  );
}
