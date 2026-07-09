import type { IntelligenceContext } from "../types/intelligence-context";
import type { SupplyChainImpactModuleOutput } from "../types/module-outputs";
import { supplyChainImpactModuleSchema } from "../schemas/module-schemas";
import {
  SUPPLY_CHAIN_IMPACT_SYSTEM_PROMPT,
  buildSupplyChainImpactUserPrompt,
} from "../prompts/module-prompts";
import { runIntelligenceModule } from "./moduleRunner";

export async function runSupplyChainImpactModule(
  ctx: IntelligenceContext,
): Promise<SupplyChainImpactModuleOutput> {
  return runIntelligenceModule(
    "supply_chain_impact",
    SUPPLY_CHAIN_IMPACT_SYSTEM_PROMPT,
    buildSupplyChainImpactUserPrompt(ctx),
    supplyChainImpactModuleSchema,
  );
}
