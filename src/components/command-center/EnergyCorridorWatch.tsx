"use client";

import { useEffect, useRef } from "react";
import { Navigation } from "lucide-react";
import { Map, Marker } from "@/lib/maplibre/client";
import type { MapLibreMapClass, MapLibreMarkerClass } from "@/lib/maplibre/client";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AlertSeverity } from "@/lib/nesi";

// Exact same CORRIDOR_DEFS coordinates + keywords as trade-corridors.tsx
const CHOKEPOINTS = [
  {
    id: "suez",
    name: "Suez Canal",
    keywords: ["suez"],
    coordinates: [32.348, 30.585] as [number, number],
  },
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    keywords: ["hormuz", "persian gulf", "iran", "gulf"],
    coordinates: [56.283, 26.566] as [number, number],
  },
  {
    id: "bab_el_mandeb",
    name: "Bab-el-Mandeb",
    keywords: ["bab-el-mandeb", "bab el mandeb", "red sea", "yemen"],
    coordinates: [43.408, 12.583] as [number, number],
  },
  {
    id: "malacca",
    name: "Strait of Malacca",
    keywords: ["malacca", "strait of malacca", "singapore strait"],
    coordinates: [100.916, 2.793] as [number, number],
  },
];

export function EnergyCorridorWatch({ activeAlerts }: { activeAlerts: any[] }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef          = useRef<MapLibreMapClass | null>(null);
  const markersRef      = useRef<MapLibreMarkerClass[]>([]);

  const getSeverity = (cp: typeof CHOKEPOINTS[0]): AlertSeverity | null => {
    const alert = activeAlerts.find(a => {
      const title = (a.title ?? "").toLowerCase();
      const desc  = (a.description ?? "").toLowerCase();
      return cp.keywords.some(kw => title.includes(kw) || desc.includes(kw));
    });
    return alert ? alert.severity : null;
  };

  // Initialize map — same settings as trade-corridors.tsx
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const maplibregl = require("maplibre-gl");

    const map = new Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [75, 15],  // Same center as TradeCorridors geopolitical map
      zoom: 2.2,         // Same zoom as TradeCorridors
      minZoom: 1.5,
      maxZoom: 8,
      attributionControl: false,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
      maxPitch: 0,
    });

    // Add native MapLibre +/- zoom control (top-right)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    mapRef.current = map;
    map.on("load", () => map.resize());

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(mapContainerRef.current!);

    return () => {
      ro.disconnect();
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render markers on alert change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    CHOKEPOINTS.forEach(cp => {
      const severity = getSeverity(cp);

      // Mirror the exact colour logic from TradeCorridors marker HTML
      const color =
        severity === "Critical" ? "#ef4444" :
        severity === "High"     ? "#f59e0b" :
        severity === "Medium"   ? "#eab308" :
                                  "#10b981";

      const borderColor =
        severity === "Critical" ? "rgba(239,68,68,0.6)"  :
        severity === "High"     ? "rgba(245,158,11,0.6)" :
        severity === "Medium"   ? "rgba(234,179,8,0.5)"  :
                                  "rgba(16,185,129,0.5)";

      const glow =
        severity === "Critical" ? "rgba(239,68,68,0.5)"  :
        severity === "High"     ? "rgba(245,158,11,0.5)" :
        severity === "Medium"   ? "rgba(234,179,8,0.4)"  :
                                  "rgba(16,185,129,0.3)";

      const statusLabel = severity ?? "Normal";
      const circleSize = severity === "Critical" ? 28 : severity === "High" ? 24 : 20;
      const doPulse = severity === "Critical" || severity === "High";

      const el = document.createElement("div");
      el.className = "relative flex flex-col items-center cursor-pointer";

      // Same marker HTML structure as TradeCorridors, colour-coded by severity
      el.innerHTML = `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${circleSize}px;height:${circleSize}px;">
          ${doPulse ? `<div style="position:absolute;inset:0;border-radius:50%;border:1px solid ${borderColor};animation:ecw-ping 2s ease-out infinite;"></div>` : ""}
          <div style="
            width:${circleSize}px;height:${circleSize}px;border-radius:50%;
            border:1.5px solid ${color};
            background:${color}33;
            box-shadow:0 0 14px ${glow};
            backdrop-filter:blur(1px);
          "></div>
        </div>
        <div style="margin-top:3px;text-align:center;font-family:system-ui,sans-serif;white-space:nowrap;">
          <div style="font-size:8px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.95);">${cp.name}</div>
          <div style="font-size:7px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:${color};text-shadow:0 1px 3px rgba(0,0,0,.9);">${statusLabel}</div>
        </div>
      `;

      const marker = new Marker({ element: el, anchor: "top" })
        .setLngLat(cp.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Inject keyframe once
    if (!document.getElementById("ecw-ping-style")) {
      const s = document.createElement("style");
      s.id = "ecw-ping-style";
      s.textContent = `@keyframes ecw-ping{0%{transform:scale(1);opacity:.6}80%{transform:scale(2.8);opacity:0}100%{transform:scale(2.8);opacity:0}}`;
      document.head.appendChild(s);
    }
  }, [activeAlerts]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center gap-2 mb-3 px-1 z-10">
        <Navigation className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategic Chokepoints</span>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden border border-white/5 min-h-[220px]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      <div className="flex items-center justify-between mt-3 px-2 text-[9px] uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="size-2 bg-emerald-500 rounded-full" /> Normal</div>
        <div className="flex items-center gap-1.5"><div className="size-2 bg-yellow-500 rounded-full" /> Medium</div>
        <div className="flex items-center gap-1.5"><div className="size-2 bg-amber-500 rounded-full" /> High</div>
        <div className="flex items-center gap-1.5"><div className="size-2 bg-red-500 rounded-full" /> Critical</div>
      </div>
    </div>
  );
}
