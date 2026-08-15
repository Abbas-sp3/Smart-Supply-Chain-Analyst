"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Ported from carbon-evolution/horus MarketIntelView — adapted for crude oil & energy markets.
export interface EnergyMarketIntel {
  marketSnapshot: {
    totalMarketCap: string; // e.g. "$14.2T"
    tracked: number;
    avgYtdPct: number;
    advancers: number;
    decliners: number;
    top3ConcentrationPct: number;
    topGainers: { id: string; ticker: string; changePct: number }[];
    topLosers: { id: string; ticker: string; changePct: number }[];
    leaders: { id: string; name: string; ticker: string; marketCap: string; capSharePct: number }[];
  };
  inventoryRatio: { period: string; value: number }[]; // e.g. SPR / commercial days cover
  leadTimes: { component: string; weeks: number; delta: number }[]; // e.g. Tanker charter times
  utilization: { segment: string; pct: number }[]; // e.g. Refinery runs
}

function utilColor(pct: number) {
  return pct >= 95 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#34d399";
}

function pctColor(v: number) {
  return v > 0 ? "#34d399" : v < 0 ? "#ef4444" : "var(--text-faint)";
}
function fmtPct(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function EnergyMarketIntelView({ intel: m }: { intel: EnergyMarketIntel }) {
  const snap = m.marketSnapshot;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-[var(--text)]">Energy Market Intelligence</h3>
        <p className="text-sm text-[var(--text-dim)]">
          Live equity snapshot for major producers, global commercial inventories, tanker lead times, and refinery utilization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
          <h4 className="mb-4 text-sm font-semibold text-[var(--text)]">Producer Equities (live)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Total Market Cap</div>
              <div className="text-2xl font-semibold tabular-nums text-[var(--text)]">{snap.totalMarketCap}</div>
              <div className="text-[10px] text-[var(--text-faint)]">{snap.tracked} producers tracked</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">Avg YTD</div>
              <div className="text-2xl font-semibold tabular-nums" style={{ color: pctColor(snap.avgYtdPct) }}>{fmtPct(snap.avgYtdPct)}</div>
              <div className="text-[10px] text-[var(--text-faint)]">across tracked names</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">24h Breadth</div>
              <div className="text-sm font-medium tabular-nums">
                <span style={{ color: "#34d399" }}>▲ {snap.advancers}</span>{" · "}
                <span style={{ color: "#ef4444" }}>▼ {snap.decliners}</span>
              </div>
              <div className="text-[10px] text-[var(--text-faint)]">advancers / decliners</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">OPEC+ Concentration</div>
              <div className="text-sm font-semibold tabular-nums" style={{ color: snap.top3ConcentrationPct >= 60 ? "#ef4444" : snap.top3ConcentrationPct >= 40 ? "#f59e0b" : "#34d399" }}>{snap.top3ConcentrationPct}%</div>
              <div className="text-[10px] text-[var(--text-faint)]">of global capacity</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
          <h4 className="mb-4 text-sm font-semibold text-[var(--text)]">Top Movers (24h)</h4>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#34d399" }}>Gainers</div>
              <ul className="space-y-2">
                {snap.topGainers.map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span className="text-[var(--text-dim)]">{c.ticker || c.id}</span>
                    <span className="font-medium tabular-nums" style={{ color: pctColor(c.changePct) }}>{fmtPct(c.changePct)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#ef4444" }}>Losers</div>
              <ul className="space-y-2">
                {snap.topLosers.map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span className="text-[var(--text-dim)]">{c.ticker || c.id}</span>
                    <span className="font-medium tabular-nums" style={{ color: pctColor(c.changePct) }}>{fmtPct(c.changePct)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
          <h4 className="mb-4 text-sm font-semibold text-[var(--text)]">Market-Cap Leaders</h4>
          <div className="space-y-4">
            {snap.leaders.map((c) => (
              <div key={c.id}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium text-[var(--text)]">{c.name} <span className="text-[var(--text-faint)]">{c.ticker}</span></span>
                  <span className="tabular-nums text-[var(--text-dim)]">{c.marketCap} · {c.capSharePct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--panel)]">
                  <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${c.capSharePct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
          <h4 className="mb-4 text-sm font-semibold text-[var(--text)]">Days of Inventory Cover</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={m.inventoryRatio} margin={{ top: 6, right: 10, bottom: 0, left: -16 }}>
              <XAxis dataKey="period" tick={{ fill: "#8695ab", fontSize: 11 }} />
              <YAxis tick={{ fill: "#5b6a80", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0b1525", border: "1px solid #1e2a3d", borderRadius: 8, fontSize: 12, color: "#e2e8f0" }} />
              <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, fill: "#0b1525", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
          <h4 className="mb-4 text-sm font-semibold text-[var(--text)]">Logistics Lead Times</h4>
          <ul className="space-y-4">
            {m.leadTimes.map((l) => (
              <li key={l.component} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-dim)]">{l.component}</span>
                <span className="font-medium tabular-nums text-[var(--text)]">
                  {l.weeks} wks{" "}
                  <span className="text-xs" style={{ color: l.delta > 0 ? "#ef4444" : l.delta < 0 ? "#34d399" : "var(--text-faint)" }}>
                    {l.delta > 0 ? `▲ +${l.delta}` : l.delta < 0 ? `▼ ${l.delta}` : "—"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-[var(--panel-border)] pt-3 text-[10px] text-[var(--text-faint)]">
            Delta vs prior quarter (weeks). Higher lead times indicate tanker shortages or rerouting (e.g. Cape of Good Hope).
          </p>
        </div>

        <div className="rounded-xl border border-[var(--panel-border)] p-4 shadow-sm" style={{ background: "#0b0f1a" }}>
          <h4 className="mb-4 text-sm font-semibold text-[var(--text)]">Refinery Capacity Utilization</h4>
          <div className="space-y-4">
            {m.utilization.map((u) => (
              <div key={u.segment}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-[var(--text-dim)]">{u.segment}</span>
                  <span className="font-medium tabular-nums" style={{ color: utilColor(u.pct) }}>{u.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--panel)]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${u.pct}%`, background: utilColor(u.pct) }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-[var(--panel-border)] pt-3 text-[10px] text-[var(--text-faint)]">
            Utilization &gt;90% restricts ability to surge production during supply shocks.
          </p>
        </div>
      </div>
    </div>
  );
}
