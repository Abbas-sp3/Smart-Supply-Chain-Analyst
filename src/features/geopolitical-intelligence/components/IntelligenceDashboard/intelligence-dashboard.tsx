"use client";

/**
 * IntelligenceDashboard — Top-level intelligence UI
 *
 * Manages data fetching via useIntelligence() and renders all intelligence
 * sections in order. This is the only component that knows about the hook.
 *
 * The AppShell, Sidebar, Header, and Map are NEVER touched by this file.
 */

import { RefreshCw, AlertCircle, Brain } from "lucide-react";

import { useIntelligence } from "../../hooks/useIntelligence";
import { IntelligenceLoader } from "../IntelligenceLoader/intelligence-loader";
import { OperationalAssessment } from "../OperationalAssessment/operational-assessment";
import { ExecutiveSummary } from "../ExecutiveSummary/executive-summary";
import { KeyDevelopments } from "../KeyDevelopments/key-developments";
import { IntelligenceObservations } from "../IntelligenceObservations/intelligence-observations";
import { MilitaryObservations } from "../MilitaryObservations/military-observations";
import { MaritimeObservations } from "../MaritimeObservations/maritime-observations";
import { AffectedCategories } from "../AffectedCategories/affected-categories";
import { AffectedProducts } from "../AffectedProducts/affected-products";
import { TradeCorridors } from "../TradeCorridors/trade-corridors";
import { PortsAndCountries } from "../PortsAndCountries/ports-and-countries";
import { AffectedIndustries } from "../AffectedIndustries/affected-industries";
import { CriticalInfrastructure } from "../CriticalInfrastructure/critical-infrastructure";
import { SupplyChainImpacts } from "../SupplyChainImpacts/supply-chain-impacts";
import { AlternativeSupply } from "../AlternativeSupply/alternative-supply";
import { ScenarioAnalysis } from "../ScenarioAnalysis/scenario-analysis";
import { Recommendations } from "../Recommendations/recommendations";
import { HistoricalContext } from "../HistoricalContext/historical-context";
import { MonitoringPriorities } from "../MonitoringPriorities/monitoring-priorities";
import { WhyIndiaShouldCare } from "../WhyIndiaShouldCare/why-india-should-care";
import { SupportingEvidence } from "../SupportingEvidence/supporting-evidence";

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const isMissingKey = message.toLowerCase().includes("groq_api_key");

  return (
    <div className="glass-panel flex flex-col items-center gap-5 px-6 py-12 text-center">
      <AlertCircle className="size-10 text-amber-400/70" />
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground/90">
          {isMissingKey
            ? "API Key Required"
            : "Intelligence Generation Failed"}
        </h3>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          {isMissingKey
            ? "Add your GROQ_API_KEY to .env.local to enable AI-powered intelligence analysis."
            : message}
        </p>
      </div>
      {!isMissingKey && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
        >
          <RefreshCw aria-hidden className="size-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header bar
// ---------------------------------------------------------------------------
function DashboardHeader({
  generatedAt,
  isLoading,
  onRefresh,
}: {
  generatedAt: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="glass-panel flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3">
        <Brain aria-hidden className="size-4 shrink-0 text-primary/70" />
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-widest text-foreground/90">
            Geopolitical & Supply Chain Intelligence
          </h1>
          {generatedAt && (
            <p className="text-[10px] text-muted-foreground/60">
              Generated{" "}
              {new Date(generatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              UTC · Auto-refreshes every 30 min
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh intelligence report"
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RefreshCw
          aria-hidden
          className={`size-3 ${isLoading ? "animate-spin" : ""}`}
        />
        {isLoading ? "Generating…" : "Refresh"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export function IntelligenceDashboard() {
  const { data, isLoading, error, generatedAt, refetch } = useIntelligence();

  return (
    <div className="space-y-4 p-4 sm:space-y-5 sm:p-5 lg:p-6">
      <DashboardHeader
        generatedAt={generatedAt}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      {isLoading && !data && <IntelligenceLoader />}

      {error && !data && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {data && (
        <div className="space-y-4 sm:space-y-5">
          <OperationalAssessment assessment={data.current_operational_assessment} />
          
          <KeyDevelopments developments={data.key_developments} />

          <ExecutiveSummary summary={data.executive_summary} />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <AffectedCategories categories={data.affected_import_categories} />
            <AffectedProducts products={data.affected_products} />
          </div>

          <TradeCorridors
            corridors={data.affected_trade_corridors}
            maritimeObservations={data.maritime_observations}
            supportingEvidence={data.supporting_evidence}
            keyDevelopments={data.key_developments}
          />

          <PortsAndCountries
            ports={data.affected_ports}
            countries={data.affected_countries}
          />

          <AffectedIndustries industries={data.affected_industries} />

          <Recommendations recommendations={data.recommendations} />

          <ScenarioAnalysis scenarios={data.scenario_analysis} />

          <SupportingEvidence evidence={data.supporting_evidence} />

          {/* Secondary / Contextual Information placed at the bottom */}
          <IntelligenceObservations observations={data.intelligence_observations} />
          <WhyIndiaShouldCare content={data.why_india_should_care} />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <MilitaryObservations observations={data.military_observations} />
            <MaritimeObservations observations={data.maritime_observations} />
          </div>

          <CriticalInfrastructure infrastructure={data.critical_infrastructure_at_risk} />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <SupplyChainImpacts impacts={data.possible_supply_chain_impacts} />
            <AlternativeSupply options={data.alternative_supply_options} />
          </div>

          <HistoricalContext events={data.historical_similar_events} />
          <MonitoringPriorities priorities={data.monitoring_priorities} />
        </div>
      )}
    </div>
  );
}
