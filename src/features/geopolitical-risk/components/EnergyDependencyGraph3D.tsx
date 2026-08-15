"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useCountry } from "@/hooks/useCountry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NodeType = "supplier" | "chokepoint" | "destination";
type RiskLevel = "high" | "medium" | "low";

interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  risk: RiskLevel;
  commodity?: string;
  volume?: string;
  detail?: string;
  x?: number; y?: number; z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  commodity: string;
  volume: number;
  risk: RiskLevel;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const INDIA_DATA = {
  nodes: [
    { id: "iraq",    name: "Iraq",         type: "supplier"    as NodeType, risk: "medium" as RiskLevel, commodity: "Crude Oil", volume: "$18.2B/yr" },
    { id: "saudi",   name: "Saudi Arabia", type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$14.1B/yr" },
    { id: "russia",  name: "Russia",       type: "supplier"    as NodeType, risk: "high"   as RiskLevel, commodity: "Crude Oil", volume: "$13.4B/yr" },
    { id: "uae",     name: "UAE",          type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$8.3B/yr" },
    { id: "qatar",   name: "Qatar",        type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "LNG",       volume: "$5.1B/yr" },
    { id: "kuwait",  name: "Kuwait",       type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$4.2B/yr" },
    { id: "usa",     name: "USA",          type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$3.8B/yr" },
    { id: "nigeria", name: "Nigeria",      type: "supplier"    as NodeType, risk: "medium" as RiskLevel, commodity: "Crude Oil", volume: "$2.1B/yr" },
    { id: "hormuz",  name: "Hormuz",       type: "chokepoint"  as NodeType, risk: "high"   as RiskLevel, detail: "20M bbl/day · CRITICAL" },
    { id: "malacca", name: "Malacca",      type: "chokepoint"  as NodeType, risk: "medium" as RiskLevel, detail: "25% global trade" },
    { id: "cape",    name: "Cape of Good Hope", type: "chokepoint" as NodeType, risk: "low" as RiskLevel, detail: "Alternate route" },
    { id: "mumbai",  name: "Mumbai",       type: "destination" as NodeType, risk: "low"    as RiskLevel, detail: "West coast hub" },
    { id: "paradip", name: "Paradip",      type: "destination" as NodeType, risk: "low"    as RiskLevel, detail: "East coast refinery" },
    { id: "vizag",   name: "Vizag",        type: "destination" as NodeType, risk: "low"    as RiskLevel, detail: "SPR + port" },
  ],
  links: [
    { source: "iraq",    target: "hormuz",  commodity: "Crude Oil", volume: 18.2, risk: "medium" as RiskLevel },
    { source: "saudi",   target: "hormuz",  commodity: "Crude Oil", volume: 14.1, risk: "low"    as RiskLevel },
    { source: "uae",     target: "hormuz",  commodity: "Crude Oil", volume: 8.3,  risk: "low"    as RiskLevel },
    { source: "qatar",   target: "hormuz",  commodity: "LNG",       volume: 5.1,  risk: "low"    as RiskLevel },
    { source: "kuwait",  target: "hormuz",  commodity: "Crude Oil", volume: 4.2,  risk: "low"    as RiskLevel },
    { source: "russia",  target: "cape",    commodity: "Crude Oil", volume: 13.4, risk: "high"   as RiskLevel },
    { source: "nigeria", target: "cape",    commodity: "Crude Oil", volume: 2.1,  risk: "medium" as RiskLevel },
    { source: "usa",     target: "malacca", commodity: "Crude Oil", volume: 3.8,  risk: "low"    as RiskLevel },
    { source: "hormuz",  target: "mumbai",  commodity: "Crude Oil", volume: 35,   risk: "high"   as RiskLevel },
    { source: "hormuz",  target: "paradip", commodity: "Crude Oil", volume: 15,   risk: "high"   as RiskLevel },
    { source: "cape",    target: "vizag",   commodity: "Crude Oil", volume: 15,   risk: "medium" as RiskLevel },
    { source: "malacca", target: "mumbai",  commodity: "Crude Oil", volume: 4,    risk: "medium" as RiskLevel },
  ],
};

const SINGAPORE_DATA = {
  nodes: [
    { id: "saudi",    name: "Saudi Arabia", type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$12.4B/yr" },
    { id: "iraq",     name: "Iraq",         type: "supplier"    as NodeType, risk: "medium" as RiskLevel, commodity: "Crude Oil", volume: "$8.9B/yr" },
    { id: "uae",      name: "UAE",          type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$6.2B/yr" },
    { id: "russia",   name: "Russia",       type: "supplier"    as NodeType, risk: "high"   as RiskLevel, commodity: "Crude Oil", volume: "$5.5B/yr" },
    { id: "qatar",    name: "Qatar",        type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "LNG",       volume: "$4.1B/yr" },
    { id: "malaysia", name: "Malaysia",     type: "supplier"    as NodeType, risk: "low"    as RiskLevel, commodity: "LNG",       volume: "$3.2B/yr" },
    { id: "hormuz",   name: "Hormuz",       type: "chokepoint"  as NodeType, risk: "high"   as RiskLevel, detail: "20M bbl/day · CRITICAL" },
    { id: "malacca",  name: "Malacca",      type: "chokepoint"  as NodeType, risk: "high"   as RiskLevel, detail: "90% Singapore imports" },
    { id: "cape",     name: "Cape of Good Hope", type: "chokepoint" as NodeType, risk: "low" as RiskLevel, detail: "Alternate route" },
    { id: "jurong",   name: "Jurong Island", type: "destination" as NodeType, risk: "low"   as RiskLevel, detail: "Main refinery complex" },
    { id: "bukom",    name: "Pulau Bukom",  type: "destination" as NodeType, risk: "low"    as RiskLevel, detail: "Shell refinery" },
    { id: "sgport",   name: "Singapore Port", type: "destination" as NodeType, risk: "low"  as RiskLevel, detail: "World's largest bunker port" },
  ],
  links: [
    { source: "saudi",    target: "hormuz",  commodity: "Crude Oil", volume: 12.4, risk: "low"    as RiskLevel },
    { source: "iraq",     target: "hormuz",  commodity: "Crude Oil", volume: 8.9,  risk: "medium" as RiskLevel },
    { source: "uae",      target: "hormuz",  commodity: "Crude Oil", volume: 6.2,  risk: "low"    as RiskLevel },
    { source: "qatar",    target: "hormuz",  commodity: "LNG",       volume: 4.1,  risk: "low"    as RiskLevel },
    { source: "malaysia", target: "malacca", commodity: "LNG",       volume: 3.2,  risk: "low"    as RiskLevel },
    { source: "russia",   target: "cape",    commodity: "Crude Oil", volume: 5.5,  risk: "high"   as RiskLevel },
    { source: "hormuz",   target: "malacca", commodity: "Crude Oil", volume: 32,   risk: "high"   as RiskLevel },
    { source: "malacca",  target: "jurong",  commodity: "Crude Oil", volume: 20,   risk: "high"   as RiskLevel },
    { source: "malacca",  target: "bukom",   commodity: "Crude Oil", volume: 10,   risk: "high"   as RiskLevel },
    { source: "malacca",  target: "sgport",  commodity: "LNG",       volume: 8,    risk: "medium" as RiskLevel },
    { source: "cape",     target: "sgport",  commodity: "Crude Oil", volume: 5,    risk: "medium" as RiskLevel },
  ],
};

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------
const RISK_HEX: Record<RiskLevel, string>    = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const TYPE_HEX: Record<NodeType, string>     = { supplier: "#3b82f6", chokepoint: "#ef4444", destination: "#22c55e" };
const TYPE_RADIUS: Record<NodeType, number>  = { supplier: 22, chokepoint: 28, destination: 20 };

// ---------------------------------------------------------------------------
// Canvas 2D renderer — no external 3D lib, pure browser canvas
// ---------------------------------------------------------------------------
interface NodePos { x: number; y: number; vx: number; vy: number; node: GraphNode }
interface LinkSim { source: NodePos; target: NodePos; link: GraphLink }
interface Particle { progress: number; speed: number }

function buildSim(nodes: GraphNode[], links: GraphLink[], w: number, h: number) {
  // Assign initial positions in a layered layout
  const layerX: Record<NodeType, number> = {
    supplier:    w * 0.15,
    chokepoint:  w * 0.5,
    destination: w * 0.85,
  };
  const byType: Record<NodeType, GraphNode[]> = { supplier: [], chokepoint: [], destination: [] };
  for (const n of nodes) byType[n.type].push(n);

  const posMap = new Map<string, NodePos>();
  for (const type of ["supplier", "chokepoint", "destination"] as NodeType[]) {
    const group = byType[type];
    group.forEach((n, i) => {
      const y = h * 0.12 + (i / Math.max(group.length - 1, 1)) * h * 0.76;
      posMap.set(n.id, { x: layerX[type] + (Math.random() - 0.5) * 20, y, vx: 0, vy: 0, node: n });
    });
  }

  const simLinks: LinkSim[] = links.map(l => ({
    source: posMap.get(l.source)!,
    target: posMap.get(l.target)!,
    link: l,
  })).filter(l => l.source && l.target);

  return { posMap, simLinks };
}

// ---------------------------------------------------------------------------
// Side panel
// ---------------------------------------------------------------------------
function NodePanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  return (
    <div className="absolute right-3 top-3 z-20 w-56 rounded-xl border border-white/10 bg-[#080c18]/95 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TYPE_HEX[node.type] }}>
            {node.type === "supplier" ? "Energy Supplier" : node.type === "chokepoint" ? "Chokepoint" : "Destination"}
          </div>
          <div className="mt-0.5 text-sm font-bold text-white">{node.name}</div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white text-base leading-none ml-2">×</button>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: RISK_HEX[node.risk] }} />
        <span className="text-[10px] capitalize" style={{ color: RISK_HEX[node.risk] }}>{node.risk} risk</span>
      </div>
      {node.commodity && <div className="mt-1.5 text-[10px] text-white/50">Commodity: <span className="text-white/80">{node.commodity}</span></div>}
      {node.volume    && <div className="mt-0.5 text-[10px] text-white/50">Volume: <span className="font-semibold text-white">{node.volume}</span></div>}
      {node.detail    && <div className="mt-1 text-[10px] text-white/50">{node.detail}</div>}
      {node.type === "chokepoint" && node.risk === "high" && (
        <div className="mt-2 rounded bg-red-500/10 px-2 py-1 text-[9px] text-red-400">
          ⚠ Closure = major disruption
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function EnergyDependencyGraph3D() {
  const { activeCountry } = useCountry();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const rawData = activeCountry.id === "singapore" ? SINGAPORE_DATA : INDIA_DATA;

  // Memoised sim state — rebuild only when data changes
  const simRef = useRef<{ posMap: Map<string, NodePos>; simLinks: LinkSim[] } | null>(null);
  const particlesRef = useRef<Map<number, Particle>>(new Map());
  const dataKeyRef   = useRef("");

  const dataKey = activeCountry.id;

  useEffect(() => {
    setSelectedNode(null);
    setHovered(null);
  }, [activeCountry.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = 0;

    function startRender(w: number, h: number) {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;

      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      // Rebuild sim if country changed
      if (dataKey !== dataKeyRef.current) {
        dataKeyRef.current = dataKey;
        simRef.current = buildSim(rawData.nodes, rawData.links, w, h);
        particlesRef.current = new Map(
          rawData.links.map((_, i) => [i, { progress: Math.random(), speed: 0.002 + rawData.links[i].volume / 8000 }])
        );
      }

      if (!simRef.current) {
        simRef.current = buildSim(rawData.nodes, rawData.links, w, h);
        particlesRef.current = new Map(
          rawData.links.map((_, i) => [i, { progress: Math.random(), speed: 0.002 + rawData.links[i].volume / 8000 }])
        );
      }

      const { posMap, simLinks } = simRef.current;

      function tick() {
        const nodes = [...posMap.values()];
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = Math.min(600 / (dist * dist), 3);
            a.vx -= (dx / dist) * force; a.vy -= (dy / dist) * force;
            b.vx += (dx / dist) * force; b.vy += (dy / dist) * force;
          }
        }
        for (const sl of simLinks) {
          const dx = sl.target.x - sl.source.x, dy = sl.target.y - sl.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const rest = 180;
          const force = (dist - rest) * 0.02;
          sl.source.vx += (dx / dist) * force; sl.source.vy += (dy / dist) * force;
          sl.target.vx -= (dx / dist) * force; sl.target.vy -= (dy / dist) * force;
        }
        const layerX: Record<NodeType, number> = { supplier: w * 0.15, chokepoint: w * 0.5, destination: w * 0.85 };
        for (const np of posMap.values()) {
          const tx = layerX[np.node.type];
          np.vx += (tx - np.x) * 0.08;
          np.vx *= 0.85; np.vy *= 0.85;
          np.x = Math.max(40, Math.min(w - 40, np.x + np.vx));
          np.y = Math.max(30, Math.min(h - 30, np.y + np.vy));
        }
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

        simLinks.forEach((sl, i) => {
          const { source: s, target: t, link } = sl;
          const color = RISK_HEX[link.risk];
          const lineW = Math.max(1, link.volume / 14);

          ctx.save();
          const grad = ctx.createLinearGradient(s.x, s.y, t.x, t.y);
          grad.addColorStop(0, color + "00");
          grad.addColorStop(0.3, color + "aa");
          grad.addColorStop(0.7, color + "aa");
          grad.addColorStop(1, color + "00");
          ctx.strokeStyle = grad;
          ctx.lineWidth = lineW;
          ctx.shadowColor = color; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
          ctx.restore();

          const p = particlesRef.current.get(i)!;
          p.progress = (p.progress + p.speed) % 1;
          const px = s.x + (t.x - s.x) * p.progress;
          const py = s.y + (t.y - s.y) * p.progress;
          ctx.save();
          ctx.shadowColor = color; ctx.shadowBlur = 12;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(px, py, Math.max(2, lineW * 0.8), 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          if (link.volume > 10) {
            const p2 = (p.progress + 0.5) % 1;
            const px2 = s.x + (t.x - s.x) * p2, py2 = s.y + (t.y - s.y) * p2;
            ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fillStyle = color + "cc";
            ctx.beginPath(); ctx.arc(px2, py2, Math.max(1.5, lineW * 0.6), 0, Math.PI * 2); ctx.fill(); ctx.restore();
          }
        });

        for (const np of posMap.values()) {
          const { x, y, node } = np;
          const r = TYPE_RADIUS[node.type];
          const isHov = hovered === node.id;
          const isSel = selectedNode?.id === node.id;
          const color = TYPE_HEX[node.type];

          ctx.save();
          if (isHov || isSel) {
            ctx.shadowColor = color; ctx.shadowBlur = 30;
            ctx.strokeStyle = color; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.shadowColor = color; ctx.shadowBlur = 20;
          const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
          bg.addColorStop(0, color + "60"); bg.addColorStop(1, color + "1a");
          ctx.fillStyle = bg;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = color + (isHov || isSel ? "ff" : "99");
          ctx.lineWidth = isHov || isSel ? 2.5 : 1.5;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

          const riskColor = RISK_HEX[node.risk];
          ctx.shadowColor = riskColor; ctx.shadowBlur = 10;
          ctx.fillStyle = riskColor;
          ctx.beginPath(); ctx.arc(x + r * 0.65, y - r * 0.65, 4, 0, Math.PI * 2); ctx.fill();

          ctx.shadowBlur = 0;
          ctx.fillStyle = isHov || isSel ? "#ffffff" : "rgba(255,255,255,0.78)";
          ctx.font = `${node.type === "chokepoint" ? "bold 11px" : "10px"} Inter, system-ui, sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(node.name, x, y);
          ctx.restore();
        }

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "bold 9px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SUPPLIER", w * 0.15, 16);
        ctx.fillText("CHOKEPOINT", w * 0.5, 16);
        ctx.fillText("DESTINATION", w * 0.85, 16);
      }

      let frameCount = 0;
      function loop() {
        if (frameCount < 120) { tick(); frameCount++; }
        draw();
        animId = requestAnimationFrame(loop);
      }
      animId = requestAnimationFrame(loop);
    }

    // Use ResizeObserver so we get real dimensions after layout paint
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        cancelAnimationFrame(animId);
        startRender(w, h);
      }
    });
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, hovered, selectedNode]);

  // Hit-testing on click / hover
  function getNodeAt(ex: number, ey: number): GraphNode | null {
    const canvas = canvasRef.current;
    if (!canvas || !simRef.current) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ex - rect.left, y = ey - rect.top;
    for (const np of simRef.current.posMap.values()) {
      const r = TYPE_RADIUS[np.node.type] + 4;
      if ((np.x - x) ** 2 + (np.y - y) ** 2 < r * r) return np.node;
    }
    return null;
  }

  return (
    <div className="relative flex flex-col rounded-xl border border-white/8 bg-[#050810] overflow-hidden" style={{ height: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 shrink-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">Energy Dependency Network</p>
          <p className="text-[10px] text-[#8b98b8] mt-0.5">
            {activeCountry.name} · supplier → chokepoint → destination · hover or click any node
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[9px] text-white/40">
            <span className="flex items-center gap-1"><span className="h-1 w-3 rounded" style={{background:"#ef4444"}} />High risk</span>
            <span className="flex items-center gap-1"><span className="h-1 w-3 rounded" style={{background:"#f59e0b"}} />Medium</span>
            <span className="flex items-center gap-1"><span className="h-1 w-3 rounded" style={{background:"#22c55e"}} />Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-[#8b98b8]">Live topology</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: hovered ? "pointer" : "default" }}
          onClick={e => {
            const n = getNodeAt(e.clientX, e.clientY);
            setSelectedNode(prev => prev?.id === n?.id ? null : (n ?? null));
          }}
          onMouseMove={e => {
            const n = getNodeAt(e.clientX, e.clientY);
            setHovered(n?.id ?? null);
          }}
          onMouseLeave={() => setHovered(null)}
        />
        {selectedNode && <NodePanel node={selectedNode} onClose={() => setSelectedNode(null)} />}

        {/* Node type legend */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1 text-[9px] text-white/40">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" />Supplier</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ef4444]" />Chokepoint</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />Destination</span>
        </div>
        <div className="absolute bottom-3 right-3 text-[9px] text-white/20">Particles ∝ trade volume</div>
      </div>
    </div>
  );
}
