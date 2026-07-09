import type { IntelligenceContext } from "../types/intelligence-context";
import type { ExecutiveSummaryModuleOutput } from "../types/module-outputs";
import { executiveSummaryModuleSchema } from "../schemas/module-schemas";
import {
  EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
  buildExecutiveSummaryUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";

export async function runExecutiveSummaryModule(
  ctx: IntelligenceContext,
): Promise<ExecutiveSummaryModuleOutput> {
  return runIntelligenceModule(
    "executive_summary",
    EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
    buildExecutiveSummaryUserPrompt(ctx),
    executiveSummaryModuleSchema,
  );
}
