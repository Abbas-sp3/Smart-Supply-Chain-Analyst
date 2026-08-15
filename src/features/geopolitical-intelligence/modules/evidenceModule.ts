import type { IntelligenceContext } from "../types/intelligence-context";
import type { EvidenceModuleOutput } from "../types/module-outputs";
import { evidenceModuleSchema } from "../schemas/module-schemas";
import {
  buildSystemPrompt,
  buildEvidenceUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";
import type { CountryProfile } from "@/data/countries/types";

export async function runEvidenceModule(
  ctx: IntelligenceContext,
  country: CountryProfile,
): Promise<EvidenceModuleOutput> {
  return runIntelligenceModule(
    "evidence",
    buildSystemPrompt(country, "evidence"),
    buildEvidenceUserPrompt(ctx, country),
    evidenceModuleSchema,
    country.id,
  );
}
