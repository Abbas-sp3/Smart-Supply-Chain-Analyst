"use client";
import { WORLD_LAND_PATH } from "@/lib/world-land-path";

// Ported from carbon-evolution/horus ManufacturingFootprint — adapted for oil refineries & ports.
export type FacilityStatus = "operating" | "planned" | "construction" | "risk";

export interface EnergyFacility {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: "refinery" | "port" | "spr";  // SPR = strategic petroleum reserve
  capacityMtpa?: number;
  status: FacilityStatus;
}

const STATUS_COLOR: Record<FacilityStatus, string> = {
  operating: "#34d399",
  planned: "#3b82f6",
  construction: "#f59e0b",
  risk: "#ef4444",
};
const STATUS_LABEL: Record<FacilityStatus, string> = {
  operating: "Operating",
  planned: "Planned",
  construction: "Under Construction",
  risk: "Risk Detected",
};
const TYPE_LABEL: Record<string, string> = {
  refinery: "Refinery",
  port: "Crude Port",
  spr: "Strategic Petroleum Reserve",
};

const W = 720;
const H = 360;
const px = (lng: number) => ((lng + 180) / 360) * W;
const py = (lat: number) => ((90 - lat) / 180) * H;

export function RefineryFootprint({ facilities, onSelect }: { facilities: EnergyFacility[]; onSelect?: (f: EnergyFacility) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative mx-auto aspect-[2/1] w-full overflow-hidden rounded-lg border border-[var(--panel-border)]" style={{ background: "#0b1525" }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
          {/* graticule */}
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * W) / 12} y1={0} x2={(i * W) / 12} y2={H} stroke="#ffffff" strokeOpacity={0.03} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i * H) / 6} x2={W} y2={(i * H) / 6} stroke="#ffffff" strokeOpacity={0.03} />
          ))}
          <path d={WORLD_LAND_PATH} fill="#1b2740" fillOpacity={0.85} stroke="#2b3b5a" strokeWidth={0.4} />

          {/* faint connection arcs */}
          {facilities.slice(1, 8).map((f, i) => {
            const a = facilities[0];
            const x1 = px(a.lng), y1 = py(a.lat), x2 = px(f.lng), y2 = py(f.lat);
            const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 24;
            return (
              <path key={`arc${i}`} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke="#38bdf8" strokeOpacity={0.08} strokeDasharray="2 3" />
            );
          })}

          {/* facility nodes */}
          {facilities.map((f) => {
            const color = STATUS_COLOR[f.status];
            const x = px(f.lng), y = py(f.lat);
            const isHq = f.type === "spr";
            return (
              <g
                key={f.id}
                onClick={onSelect ? () => onSelect(f) : undefined}
                className={onSelect ? "cursor-pointer" : undefined}
              >
                {onSelect && <circle cx={x} cy={y} r={11} fill="transparent" />}
                <circle cx={x} cy={y} r={7} fill={color} fillOpacity={0.18} />
                {isHq ? (
                  <rect x={x - 3} y={y - 3} width={6} height={6} fill={color} stroke="#e2e8f0" strokeWidth={0.6} transform={`rotate(45 ${x} ${y})`}>
                    <title>{`${f.name} · ${f.city}, ${f.country} — ${TYPE_LABEL[f.type]} — ${STATUS_LABEL[f.status]}${f.capacityMtpa ? ` — ${f.capacityMtpa} Mtpa` : ""}`}</title>
                  </rect>
                ) : (
                  <circle cx={x} cy={y} r={3} fill={color}>
                    <title>{`${f.name} · ${f.city}, ${f.country} — ${TYPE_LABEL[f.type]} — ${STATUS_LABEL[f.status]}${f.capacityMtpa ? ` — ${f.capacityMtpa} Mtpa` : ""}`}</title>
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-dim)]">
        {(Object.keys(STATUS_COLOR) as FacilityStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[s] }} />
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rotate-45 border border-slate-300 bg-[var(--text-dim)]" />
          Strategic Petroleum Reserve
        </span>
      </div>
    </div>
  );
}
