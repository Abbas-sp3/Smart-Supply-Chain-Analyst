import type { IntelligenceContext } from "../types/intelligence-context";
import type { ScenarioAnalysisModuleOutput } from "../types/module-outputs";
import { scenarioAnalysisModuleSchema } from "../schemas/module-schemas";
import {
  buildSystemPrompt,
  buildScenarioAnalysisUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";
import type { CountryProfile } from "@/data/countries/types";

export async function runScenarioAnalysisModule(
  ctx: IntelligenceContext,
  contextHash: string,
  country: CountryProfile,
): Promise<ScenarioAnalysisModuleOutput> {
  return runIntelligenceModule(
    "scenario_analysis",
    buildSystemPrompt(country, "scenario"),
    buildScenarioAnalysisUserPrompt(ctx, country),
    scenarioAnalysisModuleSchema,
    country.id,
    contextHash,
  );
}
