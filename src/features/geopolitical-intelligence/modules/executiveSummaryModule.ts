import type { IntelligenceContext } from "../types/intelligence-context";
import type { ExecutiveSummaryModuleOutput } from "../types/module-outputs";
import { executiveSummaryModuleSchema } from "../schemas/module-schemas";
import {
  buildSystemPrompt,
  buildExecutiveSummaryUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";
import type { CountryProfile } from "@/data/countries/types";

export async function runExecutiveSummaryModule(
  ctx: IntelligenceContext,
  country: CountryProfile,
): Promise<ExecutiveSummaryModuleOutput> {
  return runIntelligenceModule(
    "executive_summary",
    buildSystemPrompt(country, "executive"),
    buildExecutiveSummaryUserPrompt(ctx, country),
    executiveSummaryModuleSchema,
    country.id,
  );
}
