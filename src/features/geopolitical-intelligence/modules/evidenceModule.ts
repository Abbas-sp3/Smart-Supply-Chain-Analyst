import type { IntelligenceContext } from "../types/intelligence-context";
import type { EvidenceModuleOutput } from "../types/module-outputs";
import { evidenceModuleSchema } from "../schemas/module-schemas";
import {
  EVIDENCE_SYSTEM_PROMPT,
  buildEvidenceUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";

export async function runEvidenceModule(
  ctx: IntelligenceContext,
): Promise<EvidenceModuleOutput> {
  return runIntelligenceModule(
    "evidence",
    EVIDENCE_SYSTEM_PROMPT,
    buildEvidenceUserPrompt(ctx),
    evidenceModuleSchema,
  );
}
