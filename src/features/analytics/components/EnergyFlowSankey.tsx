"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SankeyNode {
  name: string;
}
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  unit?: string;
}

// Origin country → corridor → destination flow. Laid out in real pixel
// coordinates (viewBox = measured size) so it fills the panel edge-to-edge and
// stays undistorted. Corridor pills are draggable — the connectors re-route
// live — and clicking a pill opens a dependency breakdown.
const PALETTE = ["#38bdf8", "#a78bfa", "#34d399", "#f59e0b", "#f87171", "#22d3ee", "#e879f9", "#a3e635"];
const MIN_STROKE = 1.5;
const MAX_STROKE = 14;
const PAD_Y = 42;
const DRAG_THRESHOLD = 4; // px moved before a press counts as a drag, not a click

interface MatInfo {
  name: string;
  color: string;
  total: number;
  sources: { name: string; value: number; share: number }[];
  destinations: { name: string; value: number; share: number }[];
}

interface CountryInfo {
  name: string;
  role: "origin" | "dest";
  total: number;
  // materials this country supplies (origin) or receives (dest), with the
  // country's share of that material's total sourcing / demand.
  materials: { name: string; color: string; value: number; share: number }[];
}

interface Model {
  originIdx: number[];
  matIdx: number[];
  destIdx: number[];
  name: (i: number) => string;
  matColor: Map<number, string>;
  matInfo: Map<number, MatInfo>;
  countryInfo: Map<number, CountryInfo>;
  neighbors: Map<number, Set<number>>;
  maxValue: number;
}

function buildModel(data: SankeyData): Model {
  const name = (i: number) => (data.nodes[i]?.name ?? "").trim();
  const hasIn = new Set<number>(), hasOut = new Set<number>();
  for (const l of data.links) { hasOut.add(l.source); hasIn.add(l.target); }
  const role = (i: number) => (hasIn.has(i) && hasOut.has(i) ? "material" : hasOut.has(i) ? "origin" : "dest");

  const originIdx = data.nodes.map((_, i) => i).filter((i) => role(i) === "origin");
  const matIdx = data.nodes.map((_, i) => i).filter((i) => role(i) === "material");
  const destIdx = data.nodes.map((_, i) => i).filter((i) => role(i) === "dest");
  const matColor = new Map(matIdx.map((idx, k) => [idx, PALETTE[k % PALETTE.length]]));

  const matInfo = new Map<number, MatInfo>();
  const inTotalOf = new Map<number, number>(), outTotalOf = new Map<number, number>();
  for (const idx of matIdx) {
    const inbound = data.links.filter((l) => l.target === idx);
    const outbound = data.links.filter((l) => l.source === idx);
    const inTotal = inbound.reduce((s, l) => s + l.value, 0) || 1;
    const outTotal = outbound.reduce((s, l) => s + l.value, 0) || 1;
    inTotalOf.set(idx, inTotal);
    outTotalOf.set(idx, outTotal);
    matInfo.set(idx, {
      name: name(idx),
      color: matColor.get(idx)!,
      total: inbound.reduce((s, l) => s + l.value, 0),
      sources: inbound
        .map((l) => ({ name: name(l.source), value: l.value, share: l.value / inTotal }))
        .sort((a, b) => b.value - a.value),
      destinations: outbound
        .map((l) => ({ name: name(l.target), value: l.value, share: l.value / outTotal }))
        .sort((a, b) => b.value - a.value),
    });
  }

  // Country breakdowns: what each origin supplies / each destination receives,
  // with that country's share of the material's total flow (its leverage).
  const countryInfo = new Map<number, CountryInfo>();
  for (const idx of originIdx) {
    const out = data.links.filter((l) => l.source === idx && matColor.has(l.target));
    countryInfo.set(idx, {
      name: name(idx), role: "origin",
      total: out.reduce((s, l) => s + l.value, 0),
      materials: out
        .map((l) => ({ name: name(l.target), color: matColor.get(l.target)!, value: l.value, share: l.value / (inTotalOf.get(l.target) || 1) }))
        .sort((a, b) => b.value - a.value),
    });
  }
  for (const idx of destIdx) {
    const inc = data.links.filter((l) => l.target === idx && matColor.has(l.source));
    countryInfo.set(idx, {
      name: name(idx), role: "dest",
      total: inc.reduce((s, l) => s + l.value, 0),
      materials: inc
        .map((l) => ({ name: name(l.source), color: matColor.get(l.source)!, value: l.value, share: l.value / (outTotalOf.get(l.source) || 1) }))
        .sort((a, b) => b.value - a.value),
    });
  }

  // Adjacency for highlight/dim on selection.
  const neighbors = new Map<number, Set<number>>();
  const link = (a: number, b: number) => {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    neighbors.get(a)!.add(b);
  };
  for (const l of data.links) { link(l.source, l.target); link(l.target, l.source); }

  return { originIdx, matIdx, destIdx, name, matColor, matInfo, countryInfo, neighbors, maxValue: Math.max(1, ...data.links.map((l) => l.value)) };
}

function spread(n: number, h: number): number[] {
  if (n <= 1) return [h / 2];
  return Array.from({ length: n }, (_, i) => PAD_Y + (i * (h - 2 * PAD_Y)) / (n - 1));
}

const VARIANT = {
  energy: {
    left: "Supplier Country", right: "Destination Port",
    originRole: "Crude Supplier", destRole: "Destination Port",
    exported: "Exported via", imported: "Imported from",
    sourcedFrom: "Suppliers using this route", shipsTo: "Ports receiving via this route", top: "dominant",
    supplies: "Flows through", receives: "Fed from",
    chokepoint: "Critical chokepoint", reliance: "High route reliance",
    hint: "Trade Corridor — drag to reposition · click for detail",
  }
} as const;

// Keep only the top-K inbound (origins) and top-M outbound (destinations) links
// per material, dropping orphaned nodes — used for the compact dashboard view.
function trimSankey(data: SankeyData, kOrigins: number, mDests: number): SankeyData {
  const hasIn = new Set<number>(), hasOut = new Set<number>();
  for (const l of data.links) { hasOut.add(l.source); hasIn.add(l.target); }
  const isMat = (i: number) => hasIn.has(i) && hasOut.has(i);
  const keep: typeof data.links = [];
  for (let m = 0; m < data.nodes.length; m++) {
    if (!isMat(m)) continue;
    keep.push(...data.links.filter((l) => l.target === m).sort((a, b) => b.value - a.value).slice(0, kOrigins));
    keep.push(...data.links.filter((l) => l.source === m).sort((a, b) => b.value - a.value).slice(0, mDests));
  }
  const used = [...new Set(keep.flatMap((l) => [l.source, l.target]))].sort((a, b) => a - b);
  const remap = new Map(used.map((i, k) => [i, k]));
  return {
    ...data,
    nodes: used.map((i) => data.nodes[i]),
    links: keep.map((l) => ({ ...l, source: remap.get(l.source)!, target: remap.get(l.target)! })),
  };
}

export function EnergyFlowSankey({ data: raw, compact = false }: { data: SankeyData; compact?: boolean }) {
  const data = useMemo(() => (compact ? trimSankey(raw, 2, 2) : raw), [raw, compact]);
  const model = useMemo(() => buildModel(data), [data]);
  const unit = data.unit ? ` ${data.unit}` : "";
  const T = VARIANT.energy;

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 760, h: 460 });
  const [selected, setSelected] = useState<number | null>(null);
  // Per-material pixel offset applied on top of its default position.
  const [offsets, setOffsets] = useState<Record<number, { dx: number; dy: number }>>({});
  const drag = useRef<{ idx: number; startX: number; startY: number; baseDx: number; baseDy: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  // A new industry's graph must reset drag + selection. Adjusted during render
  // rather than in an effect so the stale offsets never paint for a frame.
  const [prevData, setPrevData] = useState(data);
  if (data !== prevData) {
    setPrevData(data);
    setOffsets({});
    setSelected(null);
  }

  // Height scales with the busiest column so pills + their "top/lead" labels
  // never overlap. Compact (dashboard) hides subtitles and packs tighter so it
  // stays balanced with the map beside it.
  // Cap at the measured container height to prevent overflowing the wrapper.
  const maxRows = Math.max(model.originIdx.length, model.matIdx.length, model.destIdx.length);
  const rowH = compact ? 46 : 62;
  const naturalH = Math.max(460, maxRows * rowH + 40);
  const minH = dims.h > 0 ? Math.min(naturalH, dims.h) : naturalH;

  const { w } = dims;
  const h = minH;
  // Wider label gutters so long country names never clip at the panel edges.
  const ORIGIN_X = Math.max(104, Math.round(w * 0.15));
  const DEST_X = Math.min(w - 104, Math.round(w * 0.85));
  const MAT_X = Math.round(w * 0.5);
  const MAT_HALF = Math.max(52, Math.min(78, w * 0.09));

  const oy = spread(model.originIdx.length, h);
  const my = spread(model.matIdx.length, h);
  const dy = spread(model.destIdx.length, h);
  const originPos = new Map(model.originIdx.map((idx, k) => [idx, { x: ORIGIN_X, y: oy[k] }]));
  const destPos = new Map(model.destIdx.map((idx, k) => [idx, { x: DEST_X, y: dy[k] }]));
  const matPos = new Map(
    model.matIdx.map((idx, k) => {
      const off = offsets[idx] ?? { dx: 0, dy: 0 };
      return [idx, { x: MAT_X + off.dx, y: my[k] + off.dy }];
    }),
  );

  const width = (v: number) => MIN_STROKE + (MAX_STROKE - MIN_STROKE) * Math.sqrt(v / model.maxValue);
  // A node stays bright when nothing is selected, when it IS the selection, or
  // when it's a direct neighbour of the selection.
  const neigh = selected !== null ? model.neighbors.get(selected) : undefined;
  const lit = (idx: number) => selected === null || idx === selected || !!neigh?.has(idx);

  // Connectors, recomputed every render from current material positions. Any
  // link whose endpoints don't resolve to the origin→material→dest layout
  // (e.g. an unexpected material→material edge) is skipped rather than crashing.
  const links = data.links.flatMap((l, i) => {
    const isInbound = matPos.has(l.target);
    const matIdx = isInbound ? l.target : l.source;
    const m = matPos.get(matIdx);
    const color = model.matColor.get(matIdx);
    if (!m || !color) return [];
    let x1, y1, x2, y2;
    if (isInbound) {
      const o = originPos.get(l.source);
      if (!o) return [];
      x1 = o.x; y1 = o.y; x2 = m.x - MAT_HALF; y2 = m.y;
    } else {
      const d = destPos.get(l.target);
      if (!d) return [];
      x1 = m.x + MAT_HALF; y1 = m.y; x2 = d.x; y2 = d.y;
    }
    const on = selected === null || l.source === selected || l.target === selected;
    return [{ i, x1, y1, x2, y2, color, value: l.value, on }];
  });

  function toSvg(e: React.PointerEvent) {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * w, y: ((e.clientY - rect.top) / rect.height) * h };
  }
  function onPointerDown(e: React.PointerEvent, idx: number) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toSvg(e);
    const off = offsets[idx] ?? { dx: 0, dy: 0 };
    drag.current = { idx, startX: p.x, startY: p.y, baseDx: off.dx, baseDy: off.dy, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const p = toSvg(e);
    const ddx = p.x - drag.current.startX, ddy = p.y - drag.current.startY;
    if (Math.hypot(ddx, ddy) > DRAG_THRESHOLD) drag.current.moved = true;
    const { idx, baseDx, baseDy } = drag.current;
    // Clamp so the pill stays between the two columns and inside the panel.
    const nx = Math.max(-(MAT_X - ORIGIN_X - MAT_HALF - 10), Math.min(DEST_X - MAT_X - MAT_HALF - 10, baseDx + ddx));
    const ny = Math.max(-(my[model.matIdx.indexOf(idx)] - 16), Math.min(h - my[model.matIdx.indexOf(idx)] - 16, baseDy + ddy));
    setOffsets((o) => ({ ...o, [idx]: { dx: nx, dy: ny } }));
  }
  function onPointerUp(e: React.PointerEvent, idx: number) {
    if (drag.current && !drag.current.moved) setSelected((s) => (s === idx ? null : idx));
    drag.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }

  const selMat = selected !== null ? model.matInfo.get(selected) : undefined;
  const selCountry = selected !== null ? model.countryInfo.get(selected) : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 grid grid-cols-3 text-[10px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
        <span>{T.left}</span>
        <span className="text-center">{T.hint}</span>
        <span className="text-right">{T.right}</span>
      </div>
      <div className="flex flex-1 gap-3 overflow-hidden">
      <div className="relative flex-1 overflow-hidden rounded-lg border border-[var(--panel-border)]" style={{ background: "#0f1524" }} ref={wrapRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full touch-none"
          onPointerMove={onPointerMove}
          onClick={() => setSelected(null)}
        >
          {/* connectors — thickness ∝ trade volume */}
          {links.map((l) => (
            <path
              key={l.i}
              d={`M${l.x1},${l.y1} C${(l.x1 + l.x2) / 2},${l.y1} ${(l.x1 + l.x2) / 2},${l.y2} ${l.x2},${l.y2}`}
              fill="none"
              stroke={l.color}
              strokeOpacity={l.on ? 0.55 : 0.08}
              strokeWidth={width(l.value)}
              strokeLinecap="round"
            />
          ))}
          {/* origin nodes — clickable */}
          {model.originIdx.map((idx) => {
            const p = originPos.get(idx)!;
            const isSel = selected === idx;
            return (
              <g key={idx} style={{ cursor: "pointer", opacity: lit(idx) ? 1 : 0.28 }}
                onClick={(e) => { e.stopPropagation(); setSelected((s) => (s === idx ? null : idx)); }}>
                <circle cx={p.x} cy={p.y} r={isSel ? 6 : 4} fill={isSel ? "#e2e8f0" : "#94a3b8"} />
                <text x={p.x - 11} y={p.y} textAnchor="end" dominantBaseline="middle" fontSize={14} fontWeight={isSel ? 700 : 400} fill={isSel ? "#f1f5f9" : "#cbd5e1"}>{model.name(idx)}</text>
              </g>
            );
          })}
          {/* destination nodes — clickable */}
          {model.destIdx.map((idx) => {
            const p = destPos.get(idx)!;
            const isSel = selected === idx;
            return (
              <g key={idx} style={{ cursor: "pointer", opacity: lit(idx) ? 1 : 0.28 }}
                onClick={(e) => { e.stopPropagation(); setSelected((s) => (s === idx ? null : idx)); }}>
                <circle cx={p.x} cy={p.y} r={isSel ? 6 : 4} fill={isSel ? "#e2e8f0" : "#94a3b8"} />
                <text x={p.x + 11} y={p.y} textAnchor="start" dominantBaseline="middle" fontSize={14} fontWeight={isSel ? 700 : 400} fill={isSel ? "#f1f5f9" : "#cbd5e1"}>{model.name(idx)}</text>
              </g>
            );
          })}
          {/* material pills — draggable + clickable */}
          {model.matIdx.map((idx) => {
            const p = matPos.get(idx)!;
            const info = model.matInfo.get(idx)!;
            const isSel = selected === idx;
            return (
              <g
                key={idx}
                style={{ cursor: "grab", opacity: lit(idx) ? 1 : 0.3 }}
                onPointerDown={(e) => onPointerDown(e, idx)}
                onPointerUp={(e) => onPointerUp(e, idx)}
                onClick={(e) => e.stopPropagation()}
              >
                <rect x={p.x - MAT_HALF} y={p.y - 16} width={MAT_HALF * 2} height={32} rx={7}
                  fill={info.color} stroke={isSel ? "#e2e8f0" : "none"} strokeWidth={2} />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight={600} fill="#0b0f17" style={{ pointerEvents: "none" }}>{info.name}</text>
                {!compact && (
                  <text x={p.x} y={p.y + 29} textAnchor="middle" fontSize={11} fill="#8b98b8" style={{ pointerEvents: "none" }}>
                    {T.top}: {info.sources[0] ? `${info.sources[0].name} ${Math.round(info.sources[0].share * 100)}%` : "—"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        </div>

        {/* detail panel — sits BESIDE the diagram (flex sibling) so it never covers the flows */}
        {selMat && (
          <div className="w-72 shrink-0 self-start overflow-y-auto rounded-lg border border-[var(--panel-border)] bg-[var(--panel-2)] p-3 text-xs" style={{ maxHeight: h }}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: selMat.color }} />
                {selMat.name}
              </span>
              <button onClick={() => setSelected(null)} className="text-[var(--text-faint)] hover:text-[var(--text)]">✕</button>
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Raw material</div>
            <div className="mt-2 text-[11px] text-[var(--text-dim)]">
              Total tracked flow <span className="tabular-nums text-[var(--text)]">{selMat.total.toFixed(1)}{unit}</span>
            </div>
            {selMat.sources[0] && selMat.sources[0].share >= 0.5 && (
              <div className="mt-1 rounded bg-[var(--risk-high)]/15 px-2 py-1 text-[10px] text-[var(--risk-high)]">
                Concentrated dependency — {selMat.sources[0].name} controls {Math.round(selMat.sources[0].share * 100)}% of tracked supply.
              </div>
            )}

            <div className="mt-3 text-[11px] font-medium text-[var(--text-dim)]">{T.sourcedFrom} ({selMat.sources.length})</div>
            <div className="mt-1 space-y-1">
              {selMat.sources.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-[11px]">
                    <span>{s.name}</span>
                    <span className="tabular-nums text-[var(--text-dim)]">{s.value.toFixed(1)}{unit} · {Math.round(s.share * 100)}%</span>
                  </div>
                  <div className="mt-0.5 h-1 rounded bg-[var(--panel-border)]">
                    <div className="h-1 rounded" style={{ width: `${Math.max(3, s.share * 100)}%`, background: selMat.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-[11px] font-medium text-[var(--text-dim)]">{T.shipsTo} ({selMat.destinations.length})</div>
            <div className="mt-1 space-y-1">
              {selMat.destinations.map((d) => (
                <div key={d.name} className="flex justify-between text-[11px]">
                  <span>{d.name}</span>
                  <span className="tabular-nums text-[var(--text-dim)]">{d.value.toFixed(1)}{unit} · {Math.round(d.share * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* country detail panel */}
        {selCountry && (
          <div className="w-72 shrink-0 self-start overflow-y-auto rounded-lg border border-[var(--panel-border)] bg-[var(--panel-2)] p-3 text-xs" style={{ maxHeight: h }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{selCountry.name}</span>
              <button onClick={() => setSelected(null)} className="text-[var(--text-faint)] hover:text-[var(--text)]">✕</button>
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
              {selCountry.role === "origin" ? T.originRole : T.destRole}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded bg-[var(--panel)] p-2">
                <div className="text-[10px] text-[var(--text-faint)]">{selCountry.role === "origin" ? T.exported : T.imported}</div>
                <div className="tabular-nums text-sm font-semibold">{selCountry.total.toFixed(1)}<span className="text-[10px] font-normal text-[var(--text-dim)]">{unit}</span></div>
              </div>
              <div className="rounded bg-[var(--panel)] p-2">
                <div className="text-[10px] text-[var(--text-faint)]">Materials</div>
                <div className="text-sm font-semibold">{selCountry.materials.length}</div>
              </div>
            </div>
            {(() => {
              const dominant = selCountry.materials.filter((m) => m.share >= 0.4);
              return dominant.length ? (
                <div className="mt-2 rounded bg-[var(--accent)]/12 px-2 py-1 text-[10px] text-[var(--accent)]">
                  {selCountry.role === "origin" ? T.chokepoint : T.reliance} for {dominant.map((m) => `${m.name} (${Math.round(m.share * 100)}%)`).join(", ")}.
                </div>
              ) : null;
            })()}

            <div className="mt-3 text-[11px] font-medium text-[var(--text-dim)]">
              {selCountry.role === "origin" ? T.supplies : T.receives}
            </div>
            <div className="mt-1 space-y-1.5">
              {selCountry.materials.map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />{m.name}
                    </span>
                    <span className="tabular-nums text-[var(--text-dim)]">{m.value.toFixed(1)}{unit}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded bg-[var(--panel-border)]">
                      <div className="h-1 rounded" style={{ width: `${Math.max(3, m.share * 100)}%`, background: m.color }} />
                    </div>
                    <span className="w-24 shrink-0 text-right text-[10px] text-[var(--text-faint)]">
                      {Math.round(m.share * 100)}% of {selCountry.role === "origin" ? "supply" : "demand"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* material colour palette — so the coloured ribbons stay identifiable */}
      <div className="mt-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
        {model.matIdx.map((idx) => {
          const info = model.matInfo.get(idx)!;
          return (
            <button
              key={idx}
              onClick={() => setSelected((s) => (s === idx ? null : idx))}
              className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: info.color }} />
              {info.name}
            </button>
          );
        })}
      </div>
      <div className="mt-1 shrink-0 text-[10px] text-[var(--text-faint)]">
        Line thickness ∝ {data.unit ? ` (${data.unit})` : ""} · {compact ? "click a corridor to trace it" : "drag to reposition · click any node for details"}
      </div>
    </div>
  );
}
