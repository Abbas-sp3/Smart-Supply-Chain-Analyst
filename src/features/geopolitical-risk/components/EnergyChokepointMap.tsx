"use client";
import { useMemo, useState } from "react";
import { chokepointsForLane, volumeToBillions, CHOKEPOINT_COORD, COUNTRY_COORD, seaVia } from "@/lib/maritime";
import { WORLD_LAND_PATH } from "@/lib/world-land-path";

const W = 720;
const H = 360;
const px = (lng: number) => ((lng + 180) / 360) * W;
const py = (lat: number) => ((90 - lat) / 180) * H;

const RISK_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#34d399" };

// Adapted from carbon-evolution/horus — energy lanes replacing raw-material lanes.
export interface EnergyLane {
  origin: string;        // e.g. "Saudi Arabia"
  destination: string;   // e.g. "India"
  commodity: string;     // e.g. "Crude Oil"
  volume: string;        // e.g. "$1.2B/yr"
  mode: "sea";
  lane: string;          // e.g. "AG → West India"
}

export interface ChokepointInfo {
  name: string;
  risk: "high" | "medium" | "low";
  share: string;         // e.g. "20%"
}

function ContainerShip({ faceLeft }: { faceLeft: boolean }) {
  return (
    <g transform={`scale(${(faceLeft ? -1 : 1) * 0.62}, 0.62)`}>
      <path d="M-12,1.5 L10,1.5 L13,4.2 L10,7 L-11,7 L-12.5,1.5 Z" fill="#274b6b" stroke="#8fb3d6" strokeWidth={0.5} />
      <path d="M-12.2,4.4 L12,4.4 L11,6 L-11,6 Z" fill="#7f1d1d" opacity={0.9} />
      <path d="M-11,-3.6 L-6.4,-3.6 L-6.4,1.5 L-11,1.5 Z" fill="#cbd5e1" />
      <rect x={-10.4} y={-2.8} width={3.4} height={0.7} fill="#64748b" />
      <rect x={-5.5} y={-0.8} width={14.5} height={2.3} fill="#14b8a6" />
      <rect x={-4.5} y={-2.9} width={11.5} height={2.1} fill="#ef4444" />
      <rect x={-3} y={-4.6} width={8} height={1.7} fill="#f59e0b" />
    </g>
  );
}

interface NamedPt { name: string; lat: number; lng: number }
interface Route {
  key: string; d: string; dur: number; begin: number; cps: string[]; faceLeft: boolean;
  lane: string; origin: string; dest: string; material: string; value: number;
}

function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} L${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)}`;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export function EnergyChokepointMap({ lanes, chokepoints }: { lanes: EnergyLane[]; chokepoints: ChokepointInfo[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const routes = useMemo<Route[]>(() => {
    const out: Route[] = [];
    lanes.forEach((s, i) => {
      const o = COUNTRY_COORD[s.origin], d = COUNTRY_COORD[s.destination];
      if (!o || !d) return;
      const cps = chokepointsForLane(s.origin, s.destination).filter((c) => CHOKEPOINT_COORD[c]);
      const dist = (a: [number, number], b: [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
      const ordered = [...cps].sort((a, b) => dist(o, CHOKEPOINT_COORD[a]) - dist(o, CHOKEPOINT_COORD[b]));
      const backbone: NamedPt[] = [
        { name: s.origin, lat: o[0], lng: o[1] },
        ...ordered.map((c) => ({ name: c, lat: CHOKEPOINT_COORD[c][0], lng: CHOKEPOINT_COORD[c][1] })),
        { name: s.destination, lat: d[0], lng: d[1] },
      ];
      const full: [number, number][] = [[backbone[0].lat, backbone[0].lng]];
      for (let k = 0; k < backbone.length - 1; k++) {
        for (const v of seaVia(backbone[k].name, backbone[k + 1].name)) full.push(v);
        full.push([backbone[k + 1].lat, backbone[k + 1].lng]);
      }
      const unwrapped: [number, number][] = full.map(([lat, lng]) => [lat, lng]);
      for (let k = 1; k < unwrapped.length; k++) {
        while (unwrapped[k][1] - unwrapped[k - 1][1] > 180) unwrapped[k][1] -= 360;
        while (unwrapped[k][1] - unwrapped[k - 1][1] < -180) unwrapped[k][1] += 360;
      }
      const xy = unwrapped.map(([lat, lng]) => [px(lng), py(lat)] as [number, number]);
      const faceLeft = xy[xy.length - 1][0] < xy[0][0];
      out.push({
        key: `${s.lane}-${i}`, d: smooth(xy), dur: 35 + (i % 15), begin: (i % 6) * 1.5, faceLeft,
        cps, lane: s.lane, origin: s.origin, dest: s.destination, material: s.commodity, value: volumeToBillions(s.volume),
      });
    });
    return out;
  }, [lanes]);

  const cpScreen = useMemo(
    () => chokepoints.filter((c) => CHOKEPOINT_COORD[c.name])
      .map((c) => ({ ...c, x: px(CHOKEPOINT_COORD[c.name][1]), y: py(CHOKEPOINT_COORD[c.name][0]) })),
    [chokepoints],
  );

  const isOn = (r: Route) => !selected || r.cps.includes(selected);
  const affected = selected ? routes.filter((r) => r.cps.includes(selected)) : [];
  const affMaterials = [...new Set(affected.map((r) => r.material))];
  const affDest = [...new Set(affected.map((r) => r.dest))];
  const affValue = affected.reduce((s, r) => s + r.value, 0);
  const fmt = (v: number) => (v >= 1 ? `$${v.toFixed(1)}B` : v > 0 ? `$${Math.round(v * 1000)}M` : "$0");
  const OFFSETS = [-W, 0, W];

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
      <div className={selected ? "xl:col-span-2" : "xl:col-span-3"}>
        <div className="relative overflow-hidden rounded-lg border border-[var(--panel-border)]" style={{ background: "#0b1525" }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`v${i}`} x1={(i * W) / 12} y1={0} x2={(i * W) / 12} y2={H} stroke="#ffffff" strokeOpacity={0.03} />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={(i * H) / 6} x2={W} y2={(i * H) / 6} stroke="#ffffff" strokeOpacity={0.03} />
            ))}
            <path d={WORLD_LAND_PATH} fill="#1b2740" fillOpacity={0.85} stroke="#2b3b5a" strokeWidth={0.4} />

            {OFFSETS.map((off) => (
              <g key={`tile${off}`} transform={`translate(${off},0)`}>
                {routes.map((r) => {
                  const on = isOn(r);
                  return (
                    <path key={r.key} d={r.d} fill="none" stroke={selected && on ? "#38bdf8" : "#4b6a9b"}
                      strokeOpacity={on ? 0.65 : 0.05} strokeWidth={on ? 1.3 : 0.7} strokeDasharray="4 4" />
                  );
                })}
                {routes.map((r) => {
                  if (!isOn(r)) return null;
                  return (
                    <g key={`ship-${r.key}`}>
                      <animateMotion dur={`${r.dur}s`} begin={`${r.begin}s`} repeatCount="indefinite" path={r.d} />
                      <ContainerShip faceLeft={r.faceLeft} />
                    </g>
                  );
                })}
              </g>
            ))}

            {routes.map((r) => {
              const o = COUNTRY_COORD[r.origin], d = COUNTRY_COORD[r.dest];
              const on = isOn(r);
              return (
                <g key={`ends-${r.key}`} opacity={on ? 1 : 0.12}>
                  <circle cx={px(o[1])} cy={py(o[0])} r={2.2} fill="#94a3b8" />
                  <circle cx={px(d[1])} cy={py(d[0])} r={2.6} fill="#38bdf8" />
                </g>
              );
            })}

            {cpScreen.map((c) => {
              const color = RISK_COLOR[c.risk] ?? "#94a3b8";
              const isSel = selected === c.name;
              return (
                <g key={c.name} style={{ cursor: "pointer" }} onClick={() => setSelected(isSel ? null : c.name)}>
                  <circle cx={c.x} cy={c.y} r={isSel ? 9 : 6} fill={color} fillOpacity={0.2}>
                    <animate attributeName="r" values={`${isSel ? 9 : 6};${isSel ? 13 : 9};${isSel ? 9 : 6}`} dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={c.x} cy={c.y} r={3.2} fill={color} stroke={isSel ? "#e2e8f0" : "none"} strokeWidth={1.2} />
                  <text x={c.x} y={c.y - 9} textAnchor="middle" fontSize={8} fill={isSel ? "#f1f5f9" : "#8b98b8"} style={{ pointerEvents: "none" }}>{c.name}</text>
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-3 rounded bg-[#0b1525]/80 px-2 py-1 text-[10px] text-[var(--text-dim)] backdrop-blur">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#38bdf8]" />Destination port</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />High-risk chokepoint</span>
            <span>🚢 tanker · click a chokepoint to isolate routes</span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="rounded-lg border border-[var(--panel-border)] p-3 text-xs" style={{ background: "#0f1524" }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{selected}</span>
            <button onClick={() => setSelected(null)} className="text-[var(--text-faint)] hover:text-[var(--text)]">✕</button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded bg-[var(--panel)] p-1.5"><div className="text-sm font-bold">{affected.length}</div><div className="text-[9px] text-[var(--text-faint)]">lanes</div></div>
            <div className="rounded bg-[var(--panel)] p-1.5"><div className="text-sm font-bold">{fmt(affValue)}</div><div className="text-[9px] text-[var(--text-faint)]">at risk</div></div>
            <div className="rounded bg-[var(--panel)] p-1.5"><div className="text-sm font-bold">{affMaterials.length}</div><div className="text-[9px] text-[var(--text-faint)]">grades</div></div>
          </div>
          {affected.length === 0 ? (
            <div className="mt-3 text-[11px] text-[var(--text-faint)]">No tracked energy lanes transit this chokepoint.</div>
          ) : (
            <>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">Affected lanes</div>
              <div className="mt-1 space-y-1">
                {affected.sort((a, b) => b.value - a.value).map((r) => (
                  <div key={r.key} className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-dim)]">{r.lane} · <span className="text-[var(--text-faint)]">{r.material}</span></span>
                    <span className="tabular-nums text-[var(--text-dim)]">{fmt(r.value)}/yr</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">Commodities at risk</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {affMaterials.map((m) => <span key={m} className="rounded bg-[var(--panel)] px-1.5 py-0.5 text-[10px] text-[var(--text-dim)]">{m}</span>)}
              </div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">Receiving ports</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {affDest.map((c) => <span key={c} className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-1.5 py-0.5 text-[10px] text-[var(--text-dim)]">{c}</span>)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
