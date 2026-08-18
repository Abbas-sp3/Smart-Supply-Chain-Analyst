"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, BookOpen } from "lucide-react";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";
import { useCountry } from "@/hooks/useCountry";

type Props = { activePreset: DisruptionPreset };

type PrecedentResult = {
  id: string;
  sourceLabel: string;
  text: string;
  type: "precedent" | "general";
};

const SINGAPORE_PRECEDENTS: PrecedentResult[] = [
  {
    id: "hist_suez_2021",
    sourceLabel: "Historical Precedent: 2021 Suez Canal Blockage",
    type: "precedent",
    text: "The 2021 Suez Canal blockage (Ever Given grounding, 23–29 March 2021) closed the canal for 6 days, disrupting $9.6B/day in global trade. Singapore-specific impact: PSA Singapore container terminals absorbed heavy vessel bunching and transshipment dwell time spikes, while marine fuel bunkering queues surged across the Western Anchorage. Sources: Lloyd's List (March 2021), Maritime and Port Authority of Singapore (MPA).",
  },
  {
    id: "hist_red_sea_2024",
    sourceLabel: "Historical Precedent: 2024 Houthi Red Sea Attacks",
    type: "precedent",
    text: "Beginning late 2023 and escalating through 2024, Houthi attacks in the Red Sea forced major carriers (Maersk, MSC, CMA CGM) to reroute via Cape of Good Hope, adding 12–14 days to Asia-Europe transit. For Singapore, this triggered an unprecedented surge in marine bunker demand (+12% in Q1 2024), major container yard congestion at Pasir Panjang, and extended lead times for European high-tech capital goods. Sources: MPA Singapore, UNCTAD Global Supply Chain Report (2024), Freightos Baltic Index.",
  },
  {
    id: "hist_aramco_2019",
    sourceLabel: "Historical Precedent: September 2019 Saudi Aramco Abqaiq Attack",
    type: "precedent",
    text: "On 14 September 2019, drone/missile strikes on Saudi Aramco's Abqaiq facility cut Saudi production by ~5.7 Mbbl/d. Brent crude spiked 15–20% on 16 September 2019. For Singapore, the event underscored critical Middle Eastern crude dependency for Jurong Island and Pulau Bukom refineries (~70% import basket). Refiners and commodity traders drew down from 90-day commercial stockpiles and secured prompt spot crude from Malaysia and the US Gulf. Sources: IEA, Reuters, Energy Market Authority (EMA).",
  },
  {
    id: "hist_malacca_2022",
    sourceLabel: "Historical Precedent: 2022 Regional Chokepoint & Strait of Malacca Congestion",
    type: "precedent",
    text: "Escalating regional naval exercises and joint maritime security alerts in the Malacca and Singapore Straits resulted in heightened vessel traffic separation and insurance war-risk adjustments. Commercial fleets coordinated with the Singapore Maritime Crisis Centre (SMCC) and Information Fusion Centre (IFC) to maintain unhindered tanker passage. Sources: ReCAAP ISC Annual Report, BIMCO.",
  },
];

const INDIA_PRECEDENTS: PrecedentResult[] = [
  {
    id: "hist_suez_2021",
    sourceLabel: "Historical Precedent: 2021 Suez Canal Blockage",
    type: "precedent",
    text: "The 2021 Suez Canal blockage (Ever Given grounding, 23–29 March 2021) closed the canal for 6 days, forcing all traffic to queue or reroute via Cape of Good Hope. Lloyd's List estimated $9.6B/day in trade disruption. UNCTAD published analysis of cascading supply chain effects. India-specific impact: delayed container arrivals and short-term freight cost spikes across JNPT and Mundra ports. Sources: Lloyd's List (March 2021), UNCTAD Policy Brief (April 2021).",
  },
  {
    id: "hist_red_sea_2024",
    sourceLabel: "Historical Precedent: 2024 Houthi Red Sea Attacks",
    type: "precedent",
    text: "Beginning late 2023 and escalating through 2024, Houthi attacks in the Red Sea forced major carriers (Maersk, MSC, CMA CGM) to reroute via Cape of Good Hope, adding 12–14 days to Asia-Europe transit. Bunker fuel costs and war-risk insurance premiums rose significantly. For India, rerouting increased freight costs and extended lead times on critical European engineering and chemical imports. Sources: UNCTAD Global Supply Chain report (January 2024), Freightos Baltic Index.",
  },
  {
    id: "hist_aramco_2019",
    sourceLabel: "Historical Precedent: September 2019 Saudi Aramco Abqaiq Attack",
    type: "precedent",
    text: "On 14 September 2019, drone/missile attacks on Saudi Aramco's Abqaiq and Khurais facilities cut Saudi production by ~5.7 Mbbl/d. Brent crude spiked 15–20% on 16 September 2019 — the largest single-day percentage move in decades. For India, the event highlighted Gulf concentration risk. Indian OMCs accelerated supply diversification toward West Africa and North America while preparing ISPRL strategic reserve drawdowns. Sources: EIA (September 2019), Reuters, MoPNG.",
  },
];

function getPrecedentsForCountry(countryId: string): PrecedentResult[] {
  if (countryId === "singapore") return SINGAPORE_PRECEDENTS;
  return INDIA_PRECEDENTS;
}

function findPrimaryPrecedent(preset: DisruptionPreset, countryId: string): PrecedentResult {
  const precedents = getPrecedentsForCountry(countryId);
  const query = [preset.id, preset.label, preset.description, ...(preset.affectedNodeIds ?? [])]
    .join(" ")
    .toLowerCase();

  if (["suez", "canal", "blockage", "grounding"].some((kw) => query.includes(kw))) {
    return precedents.find(p => p.id === "hist_suez_2021") ?? precedents[0];
  }
  if (["red_sea", "bab", "houthi", "interdiction"].some((kw) => query.includes(kw))) {
    return precedents.find(p => p.id === "hist_red_sea_2024") ?? precedents[0];
  }
  if (["malacca", "singapore", "piracy", "anchorage"].some((kw) => query.includes(kw))) {
    return precedents.find(p => p.id === "hist_malacca_2022") ?? precedents.find(p => p.id === "hist_red_sea_2024") ?? precedents[0];
  }
  if (["hormuz", "gulf", "aramco"].some((kw) => query.includes(kw))) {
    return precedents.find(p => p.id === "hist_aramco_2019") ?? precedents[0];
  }
  if (preset.category === "energy") {
    return precedents.find(p => p.id === "hist_aramco_2019") ?? precedents[0];
  }
  return precedents[0];
}

function findSecondaryPrecedent(preset: DisruptionPreset, primary: PrecedentResult, countryId: string): PrecedentResult {
  const precedents = getPrecedentsForCountry(countryId);
  const others = precedents.filter((p) => p.id !== primary.id);
  if (preset.category === "energy") {
    return others.find((p) => p.id === "hist_red_sea_2024") ?? others[0];
  }
  if (preset.category === "multi_sector") {
    return others.find((p) => p.id === "hist_suez_2021") ?? others[0];
  }
  return others[0];
}

export function HistoricalPatternAnalysis({ activePreset }: Props) {
  const { activeCountry } = useCountry();
  const [primary, setPrimary] = useState<PrecedentResult | null>(null);
  const [secondary, setSecondary] = useState<PrecedentResult | null>(null);
  const [calibration, setCalibration] = useState<typeof activePreset.historicalCalibrationCase | undefined>(undefined);

  useEffect(() => {
    const p = findPrimaryPrecedent(activePreset, activeCountry.id);
    const s = findSecondaryPrecedent(activePreset, p, activeCountry.id);
    setPrimary(p);
    setSecondary(s);
    setCalibration(activePreset.historicalCalibrationCase);
  }, [activePreset, activeCountry.id]);

  return (
    <div className="solid-card rounded-xl border border-white/10 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-4 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
            Historical Pattern Analysis
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 bg-white/[0.04] px-2.5 py-0.5 rounded border border-white/8">
          {activeCountry.name} Profile
        </span>
      </div>

      {!primary ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" /> Loading precedent...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Primary precedent */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="size-4 text-amber-400 shrink-0" />
              <p className="text-xs font-semibold text-amber-300">{primary.sourceLabel}</p>
            </div>
            <p className="text-xs leading-relaxed text-foreground/75">{primary.text}</p>
          </div>

          {/* Calibration case if it exists, otherwise show secondary precedent */}
          {calibration ? (
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2">
                <History className="size-4 text-sky-400 shrink-0" />
                <p className="text-xs font-semibold text-sky-300">
                  Calibration Case: {calibration.eventName} ({calibration.year})
                </p>
              </div>
              <div className="space-y-2 text-xs text-foreground/75">
                <p>
                  Actual duration:{" "}
                  <span className="font-semibold text-foreground">{calibration.actualDurationDays} days</span>
                </p>
                <p>
                  Reported supply gap:{" "}
                  <span className="font-semibold text-foreground">
                    {calibration.reportedSupplyGapMtpa.min}–{calibration.reportedSupplyGapMtpa.max}{" "}
                    {calibration.reportedSupplyGapMtpa.unit}
                  </span>
                </p>
                <p>
                  ETA shift:{" "}
                  <span className="font-semibold text-foreground">
                    {calibration.reportedEtaShiftDays.min}–{calibration.reportedEtaShiftDays.max} days
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-2">
                  {calibration.sourceDescription}
                </p>
              </div>
            </div>
          ) : secondary ? (
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2">
                <History className="size-4 text-sky-400 shrink-0" />
                <p className="text-xs font-semibold text-sky-300">{secondary.sourceLabel}</p>
              </div>
              <p className="text-xs leading-relaxed text-foreground/75">{secondary.text}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
