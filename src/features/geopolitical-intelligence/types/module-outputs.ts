/**
 * Typed outputs from each independent intelligence module.
 * Modules return structured data — React handles presentation.
 */

import type {
  OperationalAssessment,
  KeyDevelopment,
  IntelligenceObservation,
  Recommendation,
  AlternativeSupplyOption,
  MonitoringPriority,
  ScenarioAnalysis,
  HistoricalEvent,
  SupportingEvidence,
  MilitaryObservation,
  MaritimeObservation,
  SupplyChainImpact,
} from "./index";

/** Shared supply-chain fact — one fact, many UI representations */
export type SupplyChainFact = {
  entity_type:
    | "country"
    | "product"
    | "port"
    | "corridor"
    | "industry"
    | "category"
    | "infrastructure";
  entity: string;
  risk: string;
  related_entities?: string[];
};

export type ExecutiveSummaryModuleOutput = {
  executive_summary: string;
  current_operational_assessment: OperationalAssessment;
  key_developments: KeyDevelopment[];
  intelligence_observations: IntelligenceObservation[];
  why_india_should_care: string;
};

export type SupplyChainImpactModuleOutput = {
  facts: SupplyChainFact[];
  supply_chain_impacts: SupplyChainImpact[];
};

export type RecommendationsModuleOutput = {
  recommendations: Recommendation[];
  alternative_supply_options: AlternativeSupplyOption[];
  monitoring_priorities: MonitoringPriority[];
};

export type ScenarioAnalysisModuleOutput = {
  scenario_analysis: ScenarioAnalysis;
  historical_similar_events: HistoricalEvent[];
};

export type EvidenceModuleOutput = {
  supporting_evidence: SupportingEvidence[];
  military_observations: MilitaryObservation[];
  maritime_observations: MaritimeObservation[];
};

export type IntelligenceModuleName =
  | "executive_summary"
  | "supply_chain_impact"
  | "recommendations"
  | "scenario_analysis"
  | "evidence";
