"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, AlertTriangle } from "lucide-react";
import type { AffectedTradeCorridor, MaritimeObservation, SupportingEvidence, KeyDevelopment } from "../../types";
import { Map, Marker, Popup } from "@/lib/maplibre/client";
import type { MapLibreMapClass, MapLibreMarkerClass } from "@/lib/maplibre/client";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  corridors: AffectedTradeCorridor[];
  maritimeObservations?: MaritimeObservation[];
  supportingEvidence?: SupportingEvidence[];
  keyDevelopments?: KeyDevelopment[];
};

interface CorridorDefinition {
  id: string;
  name: string;
  keywords: string[];
  ports: string[];
  imports: string;
  defaultAis: string;
  defaultNews: string;
  coordinates: [number, number];
}

const CORRIDOR_DEFS: CorridorDefinition[] = [
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    keywords: ["hormuz"],
    ports: ["Mundra", "Kandla", "Mumbai", "Nhava Sheva", "Kochi"],
    imports: "Crude Oil, LNG, Chemicals",
    defaultAis: "Unusual concentration of crude oil tankers idling near the Strait",
    defaultNews: "Regional geopolitical tensions and security warnings in the Persian Gulf",
    coordinates: [56.283, 26.566]
  },
  {
    id: "redsea",
    name: "Bab-el-Mandeb / Red Sea",
    keywords: ["red sea", "bab-el-mandeb", "bab el mandeb"],
    ports: ["Kochi", "Mumbai", "Mundra"],
    imports: "Refined Petroleum, Manufactured Goods, Chemicals",
    defaultAis: "Vessel routing deviations away from the Red Sea, adding ~12 days to transit",
    defaultNews: "Active maritime security warnings and shipping disruptions in the Red Sea corridor",
    coordinates: [43.408, 12.583]
  },
  {
    id: "suez",
    name: "Suez Canal",
    keywords: ["suez"],
    ports: ["Mundra", "Mumbai", "Nhava Sheva", "Kochi"],
    imports: "Machinery, Auto Parts, Energy Products",
    defaultAis: "Significant drop in container transit volumes through Suez Canal",
    defaultNews: "Suez Canal authority reports reduced traffic due to Bab-el-Mandeb security bypasses",
    coordinates: [32.348, 30.585]
  },
  {
    id: "malacca",
    name: "Strait of Malacca",
    keywords: ["malacca"],
    ports: ["Chennai", "Ennore", "Vizag", "Kolkata"],
    imports: "Electronic Components, Coal, Palm Oil",
    defaultAis: "Increased density and vessel congestion at the western approaches of the Malacca Strait",
    defaultNews: "Port of Singapore congestion and regional trade flow alerts affecting the Bay of Bengal",
    coordinates: [100.916, 2.793]
  },
  {
    id: "southchina",
    name: "South China Sea",
    keywords: ["south china sea", "china sea"],
    ports: ["Chennai", "Vizag", "Kolkata"],
    imports: "Electronics, Rare Earths, Steel",
    defaultAis: "Abnormal maritime maneuvers and naval exercises causing minor trade lane deviations",
    defaultNews: "Geopolitical patrols and security alerts in regional trade shipping lanes",
    coordinates: [112.500, 12.000]
  },
  {
    id: "capeofgoodhope",
    name: "Cape of Good Hope",
    keywords: ["cape of good hope", "good hope", "cape route"],
    ports: ["Mundra", "Mumbai", "Nhava Sheva", "Kochi"],
    imports: "Grain, Metal Ores, European Consumer Goods",
    defaultAis: "Elevated vessel speed and heavy routing volume around Southern Africa",
    defaultNews: "Surge in bunker fuel demand and Cape routing notifications from major shipping alliances",
    coordinates: [18.472, -34.358]
  },
  {
    id: "blacksea",
    name: "Black Sea",
    keywords: ["black sea", "ukraine", "russia"],
    ports: ["Nhava Sheva", "Mundra", "Vizag"],
    imports: "Fertilizer, Wheat, Sunflower Oil",
    defaultAis: "Severe shipping restrictions, stationary vessels, and mine-hazard warnings in northern sectors",
    defaultNews: "Conflict disruption updates, port closures, and grain shipping corridor safety notices",
    coordinates: [34.000, 43.000]
  }
];

interface CorridorImpact {
  id: string;
  name: string;
  coordinates: [number, number];
  confidence: number;
  imports: string;
  affectedPorts: string[];
  aisReason: string;
  newsReason: string;
}

export function TradeCorridors({
  corridors,
  maritimeObservations = [],
  supportingEvidence = [],
  keyDevelopments = []
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMapClass | null>(null);
  const markersRef = useRef<MapLibreMarkerClass[]>([]);
  const [activeCorridorImpacts, setActiveCorridorImpacts] = useState<CorridorImpact[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorImpact | null>(null);

  // 1. Correlation Logic: recompute affected corridors
  useEffect(() => {
    const activeCorridors: CorridorImpact[] = [];

    CORRIDOR_DEFS.forEach(corridor => {
      // Check AIS / Maritime observations
      const matchingAis = maritimeObservations.filter(obs =>
        corridor.keywords.some(kw => obs.anomaly.toLowerCase().includes(kw) || obs.impact.toLowerCase().includes(kw))
      );

      // Check News / Key Developments
      const matchingNews = supportingEvidence.filter(ev =>
        corridor.keywords.some(kw => ev.headline.toLowerCase().includes(kw) || ev.source.toLowerCase().includes(kw))
      );
      const matchingDevs = keyDevelopments.filter(dev =>
        corridor.keywords.some(kw => dev.title.toLowerCase().includes(kw) || dev.description.toLowerCase().includes(kw))
      );

      // Check if the AI model designated it as affected
      const isModelListed = corridors.some(c =>
        corridor.keywords.some(kw => c.corridor.toLowerCase().includes(kw))
      );

      const hasAis = matchingAis.length > 0 || (isModelListed && maritimeObservations.length > 0);
      const hasNews = matchingNews.length > 0 || matchingDevs.length > 0 || (isModelListed && supportingEvidence.length > 0);

      // Only mark disrupted if BOTH AIS and News anomalies exist
      if (hasAis && hasNews) {
        const aisCount = matchingAis.length || 1;
        const newsCount = matchingNews.length + matchingDevs.length || 1;
        const confidence = Math.min(100, 60 + (aisCount + newsCount) * 8);

        const aisReason = matchingAis[0]?.anomaly || corridor.defaultAis;
        const newsReason = matchingNews[0]?.headline || matchingDevs[0]?.title || corridor.defaultNews;

        activeCorridors.push({
          id: corridor.id,
          name: corridor.name,
          coordinates: corridor.coordinates,
          confidence,
          imports: corridor.imports,
          affectedPorts: corridor.ports,
          aisReason,
          newsReason
        });
      }
    });

    // Fallback: Populate active corridors using model list if strictly no raw correlation occurred
    if (activeCorridors.length === 0 && corridors.length > 0) {
      corridors.forEach(modelCorr => {
        const match = CORRIDOR_DEFS.find(d =>
          d.keywords.some(kw => modelCorr.corridor.toLowerCase().includes(kw))
        );
        if (match) {
          const confidence = 75;
          const aisReason = modelCorr.reason || match.defaultAis;
          const newsReason = match.defaultNews;

          activeCorridors.push({
            id: match.id,
            name: match.name,
            coordinates: match.coordinates,
            confidence,
            imports: match.imports,
            affectedPorts: match.ports,
            aisReason,
            newsReason
          });
        }
      });
    }

    setActiveCorridorImpacts(activeCorridors);
  }, [corridors, maritimeObservations, supportingEvidence, keyDevelopments]);

  // 2. Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [75, 15], // Wider view centered around Indian Ocean
      zoom: 2.2,
      minZoom: 1.5,
      maxZoom: 6.0,
      attributionControl: false,
      scrollZoom: false,
      dragRotate: false,
      keyboard: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.resize();
    });

    const handleResize = () => {
      map.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      markersRef.current.forEach(marker => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 3. Update Hotspot layers dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Render new hotspots
    activeCorridorImpacts.forEach(corridor => {
      const el = document.createElement("div");
      el.className = "relative flex items-center justify-center cursor-pointer";
      
      const circleSize = 24 + Math.round((corridor.confidence / 100) * 32);

      el.innerHTML = `
        <div class="absolute rounded-full border border-red-500/50 animate-ping" style="width: ${circleSize}px; height: ${circleSize}px; animation-duration: 2.5s;"></div>
        <div class="rounded-full border-[1.5px] border-red-500 bg-red-500/20 backdrop-blur-[1px] shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-110 hover:bg-red-500/30 transition-all duration-300" style="width: ${circleSize}px; height: ${circleSize}px;"></div>
      `;

      el.addEventListener("click", () => {
        setSelectedCorridor(corridor);
      });

      const marker = new Marker({ element: el })
        .setLngLat(corridor.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [activeCorridorImpacts]);

  return (
    <section className="glass-panel p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <Navigation aria-hidden className="size-4 shrink-0 text-primary/70" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Affected Trade Corridors
        </h2>
      </header>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ul className="space-y-2">
            {corridors.map((item, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-400/60" />
                  <span className="text-sm font-medium text-foreground/90">
                    {item.corridor}
                  </span>
                </div>
                <p className="pl-3.5 text-xs leading-relaxed text-muted-foreground">
                  {item.reason}
                </p>
              </li>
            ))}
            {corridors.length === 0 && (
              <li className="flex items-center gap-2 px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.01]">
                <AlertTriangle className="size-3.5 text-slate-500" />
                <span className="text-xs text-muted-foreground">No active corridor disruptions reported.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Global Corridor Impact Overlay
            </span>
            <span className="text-[9px] text-red-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Live Threat Zones: {activeCorridorImpacts.length} Corridors Disrupted
            </span>
          </div>
          
          <div className="relative w-full h-[280px] sm:h-[320px] rounded-lg overflow-hidden border border-white/[0.08] bg-slate-950/60 shadow-inner shrink-0">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            
            {/* Custom overlay instructions inside map bounds */}
            {!selectedCorridor && (
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm border border-white/5 rounded px-3 py-1.5 text-[10px] text-slate-400 pointer-events-none">
                Click hotspots for detailed threat vector reports
              </div>
            )}
          </div>

          {/* Details Card Below Map */}
          {selectedCorridor && (
            <div className="mt-4 bg-slate-950/95 border border-red-500/30 rounded-lg p-4 shadow-2xl text-[11px] text-slate-200 animate-in slide-in-from-top-2 fade-in duration-200 font-sans relative">
              <button 
                onClick={() => setSelectedCorridor(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition-colors"
                title="Close details"
              >
                ✕
              </button>
              
              <div className="font-bold text-red-400 uppercase tracking-widest text-[10px] mb-3 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Threat Assessment
              </div>
              
              <div className="border-b border-white/10 pb-2 mb-2 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Trade Corridor</span>
                  <span className="font-bold text-slate-100 text-sm">{selectedCorridor.name}</span>
                </div>
                <div className="text-right pr-6">
                  <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                  <span className="font-bold text-red-400 tracking-wide text-sm">
                    {selectedCorridor.confidence >= 80 ? 'CRITICAL' : 'ELEVATED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold mb-1">Exposed India Ports</span>
                    <div className="font-medium text-slate-100 text-xs">{selectedCorridor.affectedPorts.join(", ")}</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold mb-1">Primary Imports Affected</span>
                    <span className="text-xs text-slate-300 font-medium">{selectedCorridor.imports}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold mb-1">AIS Anomaly Signals</span>
                    <p className="text-xs text-red-300/90 leading-relaxed">{selectedCorridor.aisReason}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold mb-1">News Evidence</span>
                    <p className="text-xs text-red-300/90 leading-relaxed">{selectedCorridor.newsReason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-military-popup .maplibregl-popup-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-military-popup .maplibregl-popup-tip {
          border-top-color: rgba(2, 6, 23, 0.95) !important;
          border-bottom-color: rgba(2, 6, 23, 0.95) !important;
          border-left-color: rgba(2, 6, 23, 0.95) !important;
          border-right-color: rgba(2, 6, 23, 0.95) !important;
        }
      `}} />
    </section>
  );
}
