import type { IntelligenceContext } from "../types/intelligence-context";
import type { ScenarioAnalysisModuleOutput } from "../types/module-outputs";
import { scenarioAnalysisModuleSchema } from "../schemas/module-schemas";
import {
  SCENARIO_ANALYSIS_SYSTEM_PROMPT,
  buildScenarioAnalysisUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";

export async function runScenarioAnalysisModule(
  ctx: IntelligenceContext,
  contextHash: string,
): Promise<ScenarioAnalysisModuleOutput> {
  return runIntelligenceModule(
    "scenario_analysis",
    SCENARIO_ANALYSIS_SYSTEM_PROMPT,
    buildScenarioAnalysisUserPrompt(ctx),
    scenarioAnalysisModuleSchema,
    contextHash,
  );
}
