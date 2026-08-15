"use client";

import { useMemo } from "react";
import { useCountry } from "@/hooks/useCountry";
import { chokepointsForLane } from "@/lib/maritime";
import { EnergyChokepointMap, type EnergyLane, type ChokepointInfo } from "./EnergyChokepointMap";
import { EnergyAlertsFeed, type EnergyAlert } from "./EnergyAlertsFeed";
import { RefineryFootprint, type EnergyFacility } from "./RefineryFootprint";

// Static chokepoints with risk levels derived from our known disruption data.
const CHOKEPOINTS: ChokepointInfo[] = [
  { name: "Strait of Hormuz",   risk: "high",   share: "~20%" },
  { name: "Suez Canal",         risk: "high",   share: "~12%" },
  { name: "Strait of Malacca",  risk: "medium", share: "~25%" },
  { name: "Bab-el-Mandeb",      risk: "high",   share: "~8%"  },
  { name: "South China Sea",    risk: "medium", share: "~33%" },
  { name: "Panama Canal",       risk: "low",    share: "~5%"  },
];

// India energy lanes — top crude import routes.
const INDIA_LANES: EnergyLane[] = [
  { origin: "Iraq",         destination: "India", commodity: "Crude Oil",  volume: "$18.2B/yr", mode: "sea", lane: "AG → West India" },
  { origin: "Saudi Arabia", destination: "India", commodity: "Crude Oil",  volume: "$14.1B/yr", mode: "sea", lane: "AG → West India" },
  { origin: "Russia",       destination: "India", commodity: "Crude Oil",  volume: "$13.4B/yr", mode: "sea", lane: "Cape Route" },
  { origin: "UAE",          destination: "India", commodity: "Crude Oil",  volume: "$8.3B/yr",  mode: "sea", lane: "AG → West India" },
  { origin: "Qatar",        destination: "India", commodity: "Crude Oil",  volume: "$5.1B/yr",  mode: "sea", lane: "AG → West India" },
  { origin: "Kuwait",       destination: "India", commodity: "Crude Oil",  volume: "$4.2B/yr",  mode: "sea", lane: "AG → West India" },
  { origin: "USA",          destination: "India", commodity: "Crude Oil",  volume: "$3.8B/yr",  mode: "sea", lane: "US → India" },
  { origin: "Nigeria",      destination: "India", commodity: "Crude Oil",  volume: "$2.1B/yr",  mode: "sea", lane: "Africa → India" },
];

// Singapore energy lanes.
const SG_LANES: EnergyLane[] = [
  { origin: "Saudi Arabia", destination: "Singapore", commodity: "Crude Oil", volume: "$12.4B/yr", mode: "sea", lane: "AG → Malacca" },
  { origin: "Iraq",         destination: "Singapore", commodity: "Crude Oil", volume: "$8.9B/yr",  mode: "sea", lane: "AG → Malacca" },
  { origin: "UAE",          destination: "Singapore", commodity: "Crude Oil", volume: "$6.2B/yr",  mode: "sea", lane: "AG → Malacca" },
  { origin: "Russia",       destination: "Singapore", commodity: "Crude Oil", volume: "$5.5B/yr",  mode: "sea", lane: "Cape Route" },
  { origin: "Qatar",        destination: "Singapore", commodity: "LNG",       volume: "$4.1B/yr",  mode: "sea", lane: "AG → Malacca" },
];

// India refinery / port facilities.
const INDIA_FACILITIES: EnergyFacility[] = [
  { id: "mundra",    name: "Mundra Port",              city: "Mundra",    country: "India", lat: 22.8, lng: 69.7, type: "port",     capacityMtpa: 210, status: "operating" },
  { id: "jnpt",     name: "JNPT (Nhava Sheva)",        city: "Mumbai",    country: "India", lat: 18.9, lng: 72.9, type: "port",     capacityMtpa: 78,  status: "operating" },
  { id: "kandla",   name: "Kandla / Deendayal",        city: "Kandla",    country: "India", lat: 23.0, lng: 70.2, type: "port",     capacityMtpa: 140, status: "operating" },
  { id: "mangalore",name: "New Mangalore Port",        city: "Mangalore", country: "India", lat: 12.9, lng: 74.8, type: "port",     capacityMtpa: 44,  status: "operating" },
  { id: "kochi",    name: "Kochi Port",                city: "Kochi",     country: "India", lat: 9.9,  lng: 76.3, type: "port",     capacityMtpa: 65,  status: "operating" },
  { id: "chennai",  name: "Chennai Port",              city: "Chennai",   country: "India", lat: 13.1, lng: 80.3, type: "port",     capacityMtpa: 65,  status: "operating" },
  { id: "ref_west", name: "West Coast Refineries",     city: "Gujarat",   country: "India", lat: 22.3, lng: 70.8, type: "refinery", capacityMtpa: 230, status: "operating" },
  { id: "ref_south",name: "South Coast Refineries",    city: "Tamil Nadu",country: "India", lat: 10.9, lng: 79.4, type: "refinery", capacityMtpa: 85,  status: "operating" },
  { id: "spr_visk", name: "SPR — Visakhapatnam",       city: "Vizag",     country: "India", lat: 17.7, lng: 83.3, type: "spr",      capacityMtpa: 3.3, status: "operating" },
  { id: "spr_man",  name: "SPR — Mangaluru",           city: "Mangalore", country: "India", lat: 12.9, lng: 74.8, type: "spr",      capacityMtpa: 1.5, status: "operating" },
];

// Singapore facilities.
const SG_FACILITIES: EnergyFacility[] = [
  { id: "jurong",   name: "Jurong Island Refineries",  city: "Singapore", country: "Singapore", lat: 1.27, lng: 103.72, type: "refinery", capacityMtpa: 67,  status: "operating" },
  { id: "bukom",    name: "Pulau Bukom Refinery",      city: "Singapore", country: "Singapore", lat: 1.21, lng: 103.74, type: "refinery", capacityMtpa: 30,  status: "operating" },
  { id: "sg_port",  name: "Port of Singapore",         city: "Singapore", country: "Singapore", lat: 1.26, lng: 103.82, type: "port",     capacityMtpa: 625, status: "operating" },
];

// Static alert feed — reflects the current most critical energy disruption signals.
const ALERTS: EnergyAlert[] = [
  { id: "a1", title: "Houthi drone activity escalates near Bab-el-Mandeb", entity: "Bab-el-Mandeb", severity: "high",   ago: "3h ago",  href: "/geopolitical-risk" },
  { id: "a2", title: "Iran threatens Strait of Hormuz closure in response to sanctions", entity: "Strait of Hormuz", severity: "high", ago: "6h ago", href: "/geopolitical-risk" },
  { id: "a3", title: "Russian ESPO Blend discount widens to $14/bbl — arbitrage opportunity", entity: "Russia", severity: "medium", ago: "1d ago", href: "/analytics" },
  { id: "a4", title: "Iraq southern oilfield output cut by 3% amid tribal protests", entity: "Iraq", severity: "medium", ago: "2d ago", href: "/geopolitical-risk" },
  { id: "a5", title: "Suez Canal southbound transit times normalising post-drought", entity: "Suez Canal", severity: "low", ago: "3d ago", href: "/geopolitical-risk" },
  { id: "a6", title: "India SPR release authorised — 4.3 Mmt drawdown begins", entity: "SPR — Vizag", severity: "low", ago: "4d ago", href: "/strategic-reserve" },
];

export function GeoHorusWidgets() {
  const { activeCountry } = useCountry();
  const isSingapore = activeCountry.id === "singapore";
  const lanes = isSingapore ? SG_LANES : INDIA_LANES;
  const facilities = isSingapore ? SG_FACILITIES : INDIA_FACILITIES;

  const activeChokepoints = useMemo(() => {
    const activeNames = new Set<string>();
    for (const lane of lanes) {
      chokepointsForLane(lane.origin, lane.destination).forEach((c) => activeNames.add(c));
    }
    return CHOKEPOINTS.filter((c) => activeNames.has(c.name));
  }, [lanes]);

  return (
    <div className="space-y-6">
      {/* ── Animated Sea Lane Map ── */}
      <section aria-labelledby="chokepoint-map-heading">
        <div className="mb-3 flex flex-col gap-1">
          <h3 id="chokepoint-map-heading" className="text-xl font-semibold text-[var(--text)]">
            Live Energy Corridor Map
          </h3>
          <p className="text-sm text-[var(--text-dim)]">
            Animated crude tanker routes and maritime chokepoints. Click a chokepoint to isolate affected lanes.
          </p>
        </div>
        <EnergyChokepointMap lanes={lanes} chokepoints={activeChokepoints} />
      </section>

      {/* ── Refinery / Port Footprint + Alerts (side by side) ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section aria-labelledby="refinery-footprint-heading" className="xl:col-span-2">
          <div className="mb-3 flex flex-col gap-1">
            <h3 id="refinery-footprint-heading" className="text-xl font-semibold text-[var(--text)]">
              Refinery &amp; Port Footprint
            </h3>
            <p className="text-sm text-[var(--text-dim)]">
              Operating facilities, at-risk sites, and strategic petroleum reserves plotted on global map.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b1525" }}>
            <RefineryFootprint facilities={facilities} />
          </div>
        </section>

        <section aria-labelledby="alerts-heading">
          <div className="mb-3 flex flex-col gap-1">
            <h3 id="alerts-heading" className="text-xl font-semibold text-[var(--text)]">
              Intelligence Alerts
            </h3>
            <p className="text-sm text-[var(--text-dim)]">
              Priority disruption signals — filterable by severity.
            </p>
          </div>
          <div className="h-[420px] rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
            <EnergyAlertsFeed alerts={ALERTS} />
          </div>
        </section>
      </div>
    </div>
  );
}
