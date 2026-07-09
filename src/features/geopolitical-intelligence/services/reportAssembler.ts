/**
 * Projects module outputs into the unified IntelligenceReport.
 * One fact → many UI representations (no duplicate AI writing).
 */

import type { IntelligenceReport } from "../types";
import type {
  ExecutiveSummaryModuleOutput,
  SupplyChainImpactModuleOutput,
  RecommendationsModuleOutput,
  ScenarioAnalysisModuleOutput,
  EvidenceModuleOutput,
  SupplyChainFact,
} from "../types/module-outputs";

function projectFacts(facts: SupplyChainFact[]): Pick<
  IntelligenceReport,
  | "affected_countries"
  | "affected_products"
  | "affected_ports"
  | "affected_trade_corridors"
  | "affected_industries"
  | "affected_import_categories"
  | "critical_infrastructure_at_risk"
> {
  const countries: IntelligenceReport["affected_countries"] = [];
  const products: IntelligenceReport["affected_products"] = [];
  const ports: IntelligenceReport["affected_ports"] = [];
  const corridors: IntelligenceReport["affected_trade_corridors"] = [];
  const industries: IntelligenceReport["affected_industries"] = [];
  const categories: IntelligenceReport["affected_import_categories"] = [];
  const infrastructure: IntelligenceReport["critical_infrastructure_at_risk"] = [];

  for (const fact of facts) {
    const reason = fact.risk;
    switch (fact.entity_type) {
      case "country":
        countries.push({ country: fact.entity, reason });
        break;
      case "product":
        products.push({ product: fact.entity, reason });
        break;
      case "port":
        ports.push({ port: fact.entity, reason });
        break;
      case "corridor":
        corridors.push({ corridor: fact.entity, reason });
        break;
      case "industry":
        industries.push({ industry: fact.entity, reason });
        break;
      case "category":
        categories.push({ category: fact.entity, reason });
        break;
      case "infrastructure":
        infrastructure.push({ infrastructure: fact.entity, risk: reason });
        break;
    }
  }

  return {
    affected_countries: countries,
    affected_products: products,
    affected_ports: ports,
    affected_trade_corridors: corridors,
    affected_industries: industries,
    affected_import_categories: categories,
    critical_infrastructure_at_risk: infrastructure,
  };
}

export function assembleIntelligenceReport(
  executive: ExecutiveSummaryModuleOutput,
  supplyChain: SupplyChainImpactModuleOutput,
  recommendations: RecommendationsModuleOutput,
  scenarios: ScenarioAnalysisModuleOutput,
  evidence: EvidenceModuleOutput,
): IntelligenceReport {
  const projected = projectFacts(supplyChain.facts);

  return {
    executive_summary: executive.executive_summary,
    current_operational_assessment: executive.current_operational_assessment,
    key_developments: executive.key_developments,
    intelligence_observations: executive.intelligence_observations,
    why_india_should_care: executive.why_india_should_care,
    ...projected,
    possible_supply_chain_impacts: supplyChain.supply_chain_impacts,
    alternative_supply_options: recommendations.alternative_supply_options,
    recommendations: recommendations.recommendations,
    monitoring_priorities: recommendations.monitoring_priorities,
    scenario_analysis: scenarios.scenario_analysis,
    historical_similar_events: scenarios.historical_similar_events,
    supporting_evidence: evidence.supporting_evidence,
    military_observations: evidence.military_observations,
    maritime_observations: evidence.maritime_observations,
  };
}
