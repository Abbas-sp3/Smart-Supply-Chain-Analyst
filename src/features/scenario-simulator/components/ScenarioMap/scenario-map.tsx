"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DisruptionPreset } from "@/features/scenario-simulator/types";
import type { LeverState } from "@/features/scenario-simulator/components/DecisionLevers/decision-levers";
import {
  project,
  toSvgDSmooth,
  CORRIDOR_ROUTES,
  SUPPLIER_CORRIDOR,
  INDIA_PORTS,
  LAND_MASSES,
  REGION_LABELS,
} from "@/features/scenario-simulator/constants/route-geometry";
import { COASTLINE_POLYGONS } from "@/features/scenario-simulator/constants/coastline-polygons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** All corridor IDs relevant to this preset (corridors only, not ports/infra) */
function affectedCorridors(preset: DisruptionPreset): string[] {
  return preset.affectedNodeIds.filter((id) => id.startsWith("corridor_"));
}

/** Resolve which alternate corridor an active lever implies */
function resolveAlternateCorridor(levers: LeverState): string | null {
  if (levers.spotCharter.enabled) {
    return levers.spotCharter.corridorId || "corridor_cape_good_hope";
  }
  if (levers.supplierSwitch.enabled) {
    return SUPPLIER_CORRIDOR[levers.supplierSwitch.toCountryId] ?? "corridor_cape_good_hope";
  }
  return null;
}

// ─── Sub-elements ─────────────────────────────────────────────────────────────

function EpicentrePing({ lon, lat }: { lon: number; lat: number }) {
  const [cx, cy] = project([lon, lat]);
  return (
    <g>
      {/* Static inner dot */}
      <circle cx={cx} cy={cy} r={4} fill="rgb(239,68,68)" fillOpacity={0.85} />
      {/* Static ring */}
      <circle cx={cx} cy={cy} r={7} fill="none" stroke="rgb(239,68,68)" strokeWidth={1.2} strokeOpacity={0.5} />
      {/* Animated ping ring 1 */}
      <circle cx={cx} cy={cy} r={7} fill="none" stroke="rgb(239,68,68)" strokeWidth={1.5} strokeOpacity={0.6}>
        <animate attributeName="r" from="7" to="22" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" from="0.6" to="0" dur="2.2s" repeatCount="indefinite" />
      </circle>
      {/* Animated ping ring 2 (offset) */}
      <circle cx={cx} cy={cy} r={7} fill="none" stroke="rgb(249,115,22)" strokeWidth={1} strokeOpacity={0.4}>
        <animate attributeName="r" from="7" to="30" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" from="0.4" to="0" dur="2.2s" begin="0.8s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function CorridorPath({
  waypoints,
  state,
  id,
}: {
  waypoints: [number, number][];
  state: "normal" | "active" | "disrupted" | "alternate";
  id: string;
}) {
  const d = toSvgDSmooth(waypoints);

  const styleMap = {
    normal: {
      stroke: "rgba(255,255,255,0.07)",
      strokeWidth: 1.2,
      dashArray: "none",
      animDur: "2s",
      animate: false,
    },
    active: {
      stroke: "rgba(249,115,22,0.6)",
      strokeWidth: 2.5,
      dashArray: "6 14",
      animDur: "5s",
      animate: true,
    },
    disrupted: {
      stroke: "rgba(239,68,68,0.75)",
      strokeWidth: 3,
      dashArray: "6 14",
      animDur: "9s",
      animate: true,
    },
    alternate: {
      stroke: "rgba(255,255,255,0.35)",
      strokeWidth: 2,
      dashArray: "7 8",
      animDur: "2s",
      animate: true,
    },
  };

  const s = styleMap[state];

  return (
    <g>
      {/* Base path (glow effect for active states) */}
      {(state === "disrupted" || state === "active") && (
        <path
          d={d}
          stroke={state === "disrupted" ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.12)"}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* Main route line */}
      <path
        d={d}
        stroke={s.stroke}
        strokeWidth={s.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={s.dashArray === "none" ? undefined : s.dashArray}
      >
        {s.animate && (
          <animate
            attributeName="stroke-dashoffset"
            from="19"
            to="0"
            dur={s.animDur}
            repeatCount="indefinite"
          />
        )}
      </path>
    </g>
  );
}

// ─── Main Map Component ───────────────────────────────────────────────────────

type ScenarioMapProps = {
  preset: DisruptionPreset;
  levers: LeverState;
  hasRun: boolean;
};

export function ScenarioMap({ preset, levers, hasRun }: ScenarioMapProps) {
  const disrupted = useMemo(() => affectedCorridors(preset), [preset]);
  const alternate = useMemo(() => resolveAlternateCorridor(levers), [levers]);
  const hasLever = levers.supplierSwitch.enabled || levers.spotCharter.enabled;

  // All corridor IDs we know about
  const allCorridorIds = Object.keys(CORRIDOR_ROUTES);

  // Epicentre coordinates from preset
  const [epicLon, epicLat] = preset.mapCoordinates as [number, number];

  return (
    <div className="glass-surface overflow-hidden rounded-xl border border-white/10">
      {/* Map header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Route Impact · {preset.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hasRun && (
            <span className="flex items-center gap-1.5 text-[10px] text-orange-400/80">
              <span className="inline-block size-1.5 rounded-full bg-red-500" />
              {disrupted.length} corridor{disrupted.length !== 1 ? "s" : ""} disrupted
            </span>
          )}
          {hasLever && alternate && alternate !== disrupted[0] && (
            <span className="flex items-center gap-1.5 text-[10px] text-white/40">
              <span
                className="inline-block h-px w-4"
                style={{ borderTop: "1.5px dashed rgba(255,255,255,0.4)" }}
              />
              alternate route active
            </span>
          )}
        </div>
      </div>

      {/* SVG map */}
      <svg
        viewBox="0 0 1000 500"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[280px] w-full"
        style={{ background: "hsl(222,50%,5%)" }}
        aria-label={`Trade route map for ${preset.label}`}
        role="img"
      >
        {/* ── Land masses (Accurate Coastlines) ── */}
        <g id="land">
          {COASTLINE_POLYGONS.map((polygon, i) => {
            const d = polygon
              .map((ring) => {
                const pts = ring.map(project);
                return `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")} Z`;
              })
              .join(" ");
            return (
              <path
                key={`coast-${i}`}
                d={d}
                fill="hsl(220,30%,10%)"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={0.5}
                fillRule="evenodd"
              />
            );
          })}
        </g>

        {/* ── Land mass labels ── */}
        <g id="land-labels" style={{ pointerEvents: "none" }}>
          {LAND_MASSES.filter((lm) => lm.label && lm.labelAt).map((lm) => {
            const [lx, ly] = project(lm.labelAt!);
            return (
              <text
                key={`label-${lm.id}`}
                x={lx}
                y={ly}
                textAnchor="middle"
                fontSize="8.5"
                fontFamily="system-ui, sans-serif"
                fontWeight="600"
                letterSpacing="1.5"
                fill="rgba(255,255,255,0.22)"
              >
                {lm.label}
              </text>
            );
          })}
        </g>

        {/* ── Ocean region labels ── */}
        <g id="ocean-labels" style={{ pointerEvents: "none" }}>
          {REGION_LABELS.map(({ label, at }) => {
            const [rx, ry] = project(at);
            return (
              <text
                key={label}
                x={rx}
                y={ry}
                textAnchor="middle"
                fontSize="7.5"
                fontFamily="system-ui, sans-serif"
                fontWeight="500"
                letterSpacing="1.8"
                fill="rgba(255,255,255,0.11)"
              >
                {label}
              </text>
            );
          })}
        </g>

        {/* ── Corridor routes ── */}
        <g id="routes">
          {allCorridorIds.map((corridorId) => {
            const waypoints = CORRIDOR_ROUTES[corridorId];
            if (!waypoints) return null;

            const isDisrupted = disrupted.includes(corridorId);
            const isAlternate = hasLever && alternate === corridorId && !isDisrupted;
            const state = isDisrupted
              ? hasRun
                ? "disrupted"
                : "active"
              : isAlternate
                ? "alternate"
                : "normal";

            return (
              <CorridorPath
                key={corridorId}
                id={corridorId}
                waypoints={waypoints}
                state={state}
              />
            );
          })}
        </g>

        {/* ── Indian port dots ── */}
        <g id="ports">
          {INDIA_PORTS.map((port) => {
            const [px, py] = project(port.coords);
            const isAffected = preset.affectedNodeIds.includes(port.id);
            return (
              <g key={port.id}>
                <circle
                  cx={px}
                  cy={py}
                  r={isAffected && hasRun ? 4 : 2.5}
                  fill={isAffected && hasRun ? "rgba(249,115,22,0.7)" : "rgba(96,165,250,0.5)"}
                  stroke={isAffected && hasRun ? "rgba(249,115,22,0.3)" : "rgba(96,165,250,0.15)"}
                  strokeWidth={isAffected && hasRun ? 5 : 3}
                />
                {/* Port label — only for affected ports or always-on key ports */}
                {(isAffected || ["port_mundra", "port_chennai"].includes(port.id)) && (
                  <text
                    x={px + 5}
                    y={py + 3}
                    fontSize="6"
                    fontFamily="system-ui, sans-serif"
                    fill={isAffected && hasRun ? "rgba(249,115,22,0.7)" : "rgba(255,255,255,0.25)"}
                    fontWeight="500"
                    letterSpacing="0.5"
                  >
                    {port.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ── Disruption epicentre ping ── */}
        <AnimatePresence>
          {(hasRun || true) && (
            <EpicentrePing lon={epicLon} lat={epicLat} />
          )}
        </AnimatePresence>

        {/* ── Legend ── */}
        <g id="legend" transform="translate(14, 474)">
          <line x1="0" y1="0" x2="22" y2="0" stroke="rgba(239,68,68,0.75)" strokeWidth="2.5" strokeDasharray="5 5" />
          <text x="27" y="4.5" fontSize="11" fill="rgba(255,255,255,0.45)" fontFamily="system-ui, sans-serif" letterSpacing="0.3">Disrupted</text>
          {hasLever && (
            <>
              <line x1="105" y1="0" x2="127" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="7 5" />
              <text x="132" y="4.5" fontSize="11" fill="rgba(255,255,255,0.45)" fontFamily="system-ui, sans-serif" letterSpacing="0.3">Alternate</text>
            </>
          )}
          <line x1="215" y1="0" x2="237" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
          <text x="242" y="4.5" fontSize="11" fill="rgba(255,255,255,0.45)" fontFamily="system-ui, sans-serif" letterSpacing="0.3">Normal</text>
          <circle cx="315" cy="0" r="3.5" fill="rgba(96,165,250,0.6)" />
          <text x="323" y="4.5" fontSize="11" fill="rgba(255,255,255,0.45)" fontFamily="system-ui, sans-serif" letterSpacing="0.3">India Port</text>
        </g>
      </svg>
    </div>
  );
}
