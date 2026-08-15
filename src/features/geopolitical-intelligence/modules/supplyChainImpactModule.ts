import type { IntelligenceContext } from "../types/intelligence-context";
import type { SupplyChainImpactModuleOutput } from "../types/module-outputs";
import { supplyChainImpactModuleSchema } from "../schemas/module-schemas";
import {
  buildSystemPrompt,
  buildSupplyChainImpactUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";
import type { CountryProfile } from "@/data/countries/types";

export async function runSupplyChainImpactModule(
  ctx: IntelligenceContext,
  country: CountryProfile,
): Promise<SupplyChainImpactModuleOutput> {
  return runIntelligenceModule(
    "supply_chain_impact",
    buildSystemPrompt(country, "supplyChain"),
    buildSupplyChainImpactUserPrompt(ctx, country),
    supplyChainImpactModuleSchema,
    country.id,
  );
}
