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
import { ExecutiveSummary } from "../ExecutiveSummary/executive-summary";
import { KeyDevelopments } from "../KeyDevelopments/key-developments";
import { AffectedCategories } from "../AffectedCategories/affected-categories";
import { AffectedProducts } from "../AffectedProducts/affected-products";
import { TradeCorridors } from "../TradeCorridors/trade-corridors";
import { PortsAndCountries } from "../PortsAndCountries/ports-and-countries";
import { AffectedIndustries } from "../AffectedIndustries/affected-industries";
import { SupplyChainImpacts } from "../SupplyChainImpacts/supply-chain-impacts";
import { AlternativeSupply } from "../AlternativeSupply/alternative-supply";
import { Recommendations } from "../Recommendations/recommendations";
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
          <ExecutiveSummary summary={data.executive_summary} />

          <KeyDevelopments developments={data.key_developments} />

          <WhyIndiaShouldCare content={data.why_india_should_care} />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <AffectedCategories categories={data.affected_import_categories} />
            <AffectedProducts products={data.affected_products} />
          </div>

          <TradeCorridors corridors={data.affected_trade_corridors} />

          <PortsAndCountries
            ports={data.affected_ports}
            countries={data.affected_countries}
          />

          <AffectedIndustries industries={data.affected_industries} />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <SupplyChainImpacts impacts={data.possible_supply_chain_impacts} />
            <AlternativeSupply options={data.alternative_supply_options} />
          </div>

          <Recommendations recommendations={data.recommendations} />

          <SupportingEvidence evidence={data.supporting_evidence} />
        </div>
      )}
    </div>
  );
}
