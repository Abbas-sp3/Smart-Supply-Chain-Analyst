/**
 * Report Assembler — Projects module outputs into the unified IntelligenceReport.
 *
 * One fact → many UI representations (no duplicate AI writing).
 *
 * NEW: Gap-fill pass after assembly — if the LLM missed certain entity types but
 * the knowledge graph has deterministic data, we fill the gaps so no dashboard
 * section remains empty when related information exists.
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
import type { SupplyChainExposureContext } from "../types/intelligence-context";

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
  const infrastructure: IntelligenceReport["critical_infrastructure_at_risk"] =
    [];

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

/**
 * Gap-fill pass: if any section is empty but the knowledge graph has relevant
 * deterministic data, fill it unconditionally. The KG exposure is always
 * available and should never leave dashboard sections empty.
 */
function gapFill(
  report: IntelligenceReport,
  exposure: SupplyChainExposureContext | undefined,
): IntelligenceReport {
  if (!exposure) return report;

  const filled = { ...report };

  // Fill every empty section from KG exposure unconditionally
  if (filled.affected_products.length === 0 && exposure.affected_products.length > 0) {
    filled.affected_products = exposure.affected_products.map((p) => ({
      product: p.product,
      reason: p.reason,
    }));
    console.log(
      `[reportAssembler] Gap-filled affected_products with ${filled.affected_products.length} items from knowledge graph.`,
    );
  }

  if (filled.affected_countries.length === 0 && exposure.affected_countries.length > 0) {
    filled.affected_countries = exposure.affected_countries.map((c) => ({
      country: c.country,
      reason: c.reason,
    }));
    console.log(
      `[reportAssembler] Gap-filled affected_countries with ${filled.affected_countries.length} items from knowledge graph.`,
    );
  }

  if (filled.affected_trade_corridors.length === 0 && exposure.affected_corridors.length > 0) {
    filled.affected_trade_corridors = exposure.affected_corridors.map((c) => ({
      corridor: c.corridor,
      reason: c.reason,
    }));
    console.log(
      `[reportAssembler] Gap-filled affected_trade_corridors with ${filled.affected_trade_corridors.length} items from knowledge graph.`,
    );
  }

  if (filled.affected_ports.length === 0 && exposure.affected_ports.length > 0) {
    filled.affected_ports = exposure.affected_ports.map((p) => ({
      port: p.port,
      reason: p.reason,
    }));
    console.log(
      `[reportAssembler] Gap-filled affected_ports with ${filled.affected_ports.length} items from knowledge graph.`,
    );
  }

  if (filled.affected_industries.length === 0 && exposure.affected_industries.length > 0) {
    filled.affected_industries = exposure.affected_industries.map((i) => ({
      industry: i.industry,
      reason: i.reason,
    }));
    console.log(
      `[reportAssembler] Gap-filled affected_industries with ${filled.affected_industries.length} items from knowledge graph.`,
    );
  }

  if (filled.affected_import_categories.length === 0 && exposure.affected_import_categories.length > 0) {
    filled.affected_import_categories = exposure.affected_import_categories.map((c) => ({
      category: c.category,
      reason: c.reason,
    }));
    console.log(
      `[reportAssembler] Gap-filled affected_import_categories with ${filled.affected_import_categories.length} items from knowledge graph.`,
    );
  }

  if (filled.critical_infrastructure_at_risk.length === 0 && exposure.critical_infrastructure.length > 0) {
    filled.critical_infrastructure_at_risk = exposure.critical_infrastructure.map((i) => ({
      infrastructure: i.infrastructure,
      risk: i.risk,
    }));
    console.log(
      `[reportAssembler] Gap-filled critical_infrastructure_at_risk with ${filled.critical_infrastructure_at_risk.length} items from knowledge graph.`,
    );
  }

  if (filled.alternative_supply_options.length === 0 && exposure.alternative_suppliers.length > 0) {
    filled.alternative_supply_options = exposure.alternative_suppliers.map((alt) => ({
      product: alt.product,
      current_source: alt.current_source,
      alternative_sources: alt.alternative_sources,
      reason: alt.reason,
    }));
    console.log(
      `[reportAssembler] Gap-filled alternative_supply_options with ${filled.alternative_supply_options.length} items from knowledge graph.`,
    );
  }

  // Also fill possible_supply_chain_impacts if empty — derive from exposure data
  if (filled.possible_supply_chain_impacts.length === 0) {
    const impacts: IntelligenceReport["possible_supply_chain_impacts"] = [];
    if (exposure.affected_corridors.length > 0) {
      impacts.push({
        impact: `Disruption to ${exposure.affected_corridors.map((c) => c.corridor).join(", ")} trade corridors`,
        reason: "Key shipping routes feeding Indian ports are exposed to current events",
      });
    }
    if (exposure.affected_products.length > 0) {
      impacts.push({
        impact: `Supply risk for ${exposure.affected_products.slice(0, 4).map((p) => p.product).join(", ")}`,
        reason: "Products traced through affected trade corridors and source countries",
      });
    }
    if (exposure.affected_ports.length > 0) {
      impacts.push({
        impact: `Potential delays at ${exposure.affected_ports.slice(0, 3).map((p) => p.port).join(", ")}`,
        reason: "Indian ports dependent on disrupted trade corridors",
      });
    }
    if (impacts.length > 0) {
      filled.possible_supply_chain_impacts = impacts;
      console.log(
        `[reportAssembler] Gap-filled possible_supply_chain_impacts with ${impacts.length} items from knowledge graph.`,
      );
    }
  }

  return filled;
}

export function assembleIntelligenceReport(
  executive: ExecutiveSummaryModuleOutput,
  supplyChain: SupplyChainImpactModuleOutput,
  recommendations: RecommendationsModuleOutput,
  scenarios: ScenarioAnalysisModuleOutput,
  evidence: EvidenceModuleOutput,
  supplyChainExposure?: SupplyChainExposureContext,
): IntelligenceReport {
  const projected = projectFacts(supplyChain.facts);

  let report: IntelligenceReport = {
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

  // Gap-fill from knowledge graph exposure data
  report = gapFill(report, supplyChainExposure);

  return report;
}
