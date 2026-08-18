"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useCountry } from "@/hooks/useCountry";
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  Layers, 
  Flame, 
  Fuel, 
  Ship, 
  Anchor, 
  Factory, 
  Activity, 
  Sparkles,
  Info,
  X
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------
type NodeType = "supplier" | "chokepoint" | "destination";
type RiskLevel = "high" | "medium" | "low";

interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  risk: RiskLevel;
  commodity: string;
  volume: string;
  volumeVal: number; // in $B
  sharePct: string;
  detail: string;
  contingency?: string;
  colIndex: number; // 0 = supplier, 1 = primary transit, 2 = corridor, 3 = destination
  rowIndex: number;
}

interface GraphLink {
  source: string;
  target: string;
  commodity: string;
  volume: number;
  risk: RiskLevel;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// Country Datasets with Precise Multi-Layer Layout Coordinates
// ---------------------------------------------------------------------------
const SINGAPORE_GRAPH = {
  stats: {
    totalVolume: "$40.2B/yr",
    chokepointExposure: "92%",
    vulnerabilityIndex: "Critical",
    activeCorridors: 3,
  },
  nodes: [
    // Suppliers (Col 0)
    { id: "saudi",    name: "Saudi Arabia", type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$12.4B/yr", volumeVal: 12.4, sharePct: "31%", detail: "Arab Light & Medium grades via Aramco term contracts", contingency: "Increase West African or US crude intake", colIndex: 0, rowIndex: 0 },
    { id: "iraq",     name: "Iraq",         type: "supplier" as NodeType, risk: "medium" as RiskLevel, commodity: "Crude Oil", volume: "$8.9B/yr",  volumeVal: 8.9,  sharePct: "22%", detail: "Basrah Heavy & Medium crude flows", contingency: "Spot market purchases from Brazil / Malaysia", colIndex: 0, rowIndex: 1 },
    { id: "uae",      name: "UAE (ADNOC)",  type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$6.2B/yr",  volumeVal: 6.2,  sharePct: "15%", detail: "Murban grade crude for petrochemical refining", contingency: "Pipeline diversions to Fujairah terminal", colIndex: 0, rowIndex: 2 },
    { id: "qatar",    name: "QatarEnergy",  type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "LNG",       volume: "$4.1B/yr",  volumeVal: 4.1,  sharePct: "10%", detail: "Long-term LNG supply for power generation", contingency: "Spot LNG from Australia (Gorgon / Wheatstone)", colIndex: 0, rowIndex: 3 },
    { id: "russia",   name: "Russia (Urals)", type: "supplier" as NodeType, risk: "high" as RiskLevel, commodity: "Crude Oil", volume: "$5.5B/yr", volumeVal: 5.5, sharePct: "14%", detail: "Discounted crude shipments via shadow fleet", contingency: "Replace with Middle East / US Gulf barrels", colIndex: 0, rowIndex: 4 },
    { id: "malaysia", name: "Malaysia",     type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "LNG / Gas", volume: "$3.1B/yr",  volumeVal: 3.1,  sharePct: "8%",  detail: "Direct pipeline natural gas & offshore LNG", contingency: "Domestic gas pipeline storage buffers", colIndex: 0, rowIndex: 5 },

    // Primary Chokepoint (Col 1)
    { id: "hormuz",   name: "Strait of Hormuz", type: "chokepoint" as NodeType, risk: "high" as RiskLevel, commodity: "All Gulf Energy", volume: "$31.6B/yr", volumeVal: 31.6, sharePct: "78%", detail: "20.5M bbl/day global artery · Persian Gulf exit", contingency: "Cape of Good Hope rerouting (+14 to +18 days latency)", colIndex: 1, rowIndex: 1.5 },

    // Secondary Corridors (Col 2 - Staggered vertically to eliminate collision)
    { id: "malacca",  name: "Strait of Malacca", type: "chokepoint" as NodeType, risk: "high" as RiskLevel, commodity: "Eastbound Tankers", volume: "$37.1B/yr", volumeVal: 37.1, sharePct: "92%", detail: "Immediate maritime approach to Singapore anchorage", contingency: "Lombok / Sunda Strait alternative (+3.5 days)", colIndex: 2, rowIndex: 0.8 },
    { id: "cape",     name: "Cape of Good Hope", type: "chokepoint" as NodeType, risk: "low"  as RiskLevel, commodity: "Atlantic / Urals", volume: "$5.5B/yr",  volumeVal: 5.5,  sharePct: "14%", detail: "Secondary southern bypass for Russian/Atlantic flows", contingency: "Standard long-haul maritime route", colIndex: 2, rowIndex: 4.2 },

    // Destinations / Refining Complexes (Col 3)
    { id: "jurong",   name: "Jurong Island",    type: "destination" as NodeType, risk: "low" as RiskLevel, commodity: "Refining Hub",   volume: "1.5M bbl/d", volumeVal: 20.0, sharePct: "50%", detail: "ExxonMobil & SRC integrated refining complexes", contingency: "Drawdown from 90-day commercial stockpiles", colIndex: 3, rowIndex: 0.8 },
    { id: "bukom",    name: "Pulau Bukom",      type: "destination" as NodeType, risk: "low" as RiskLevel, commodity: "Shell Refinery", volume: "500k bbl/d", volumeVal: 10.0, sharePct: "25%", detail: "Bukom energy & chemical manufacturing park", contingency: "Refinery throughput modulation", colIndex: 3, rowIndex: 2.5 },
    { id: "sgport",   name: "Singapore Port",   type: "destination" as NodeType, risk: "low" as RiskLevel, commodity: "Bunker Terminal", volume: "54M tonnes", volumeVal: 10.2, sharePct: "25%", detail: "World's #1 bunkering & maritime refueling hub", contingency: "Prioritize commercial vessel refueling allocations", colIndex: 3, rowIndex: 4.2 },
  ],
  links: [
    { source: "saudi",    target: "hormuz",  commodity: "Crude Oil", volume: 12.4, risk: "low"    as RiskLevel },
    { source: "iraq",     target: "hormuz",  commodity: "Crude Oil", volume: 8.9,  risk: "medium" as RiskLevel },
    { source: "uae",      target: "hormuz",  commodity: "Crude Oil", volume: 6.2,  risk: "low"    as RiskLevel },
    { source: "qatar",    target: "hormuz",  commodity: "LNG",       volume: 4.1,  risk: "low"    as RiskLevel },
    { source: "russia",   target: "cape",    commodity: "Crude Oil", volume: 5.5,  risk: "high"   as RiskLevel },
    { source: "malaysia", target: "malacca", commodity: "LNG / Gas", volume: 3.1,  risk: "low"    as RiskLevel },
    { source: "hormuz",   target: "malacca", commodity: "Crude & LNG", volume: 31.6, risk: "high" as RiskLevel },
    { source: "cape",     target: "malacca", commodity: "Crude Oil", volume: 5.5,  risk: "medium" as RiskLevel },
    { source: "malacca",  target: "jurong",  commodity: "Feedstock", volume: 20.0, risk: "high"   as RiskLevel },
    { source: "malacca",  target: "bukom",   commodity: "Feedstock", volume: 10.0, risk: "high"   as RiskLevel },
    { source: "malacca",  target: "sgport",  commodity: "Bunkers",   volume: 10.2, risk: "medium" as RiskLevel },
  ],
};

const INDIA_GRAPH = {
  stats: {
    totalVolume: "$69.2B/yr",
    chokepointExposure: "85%",
    vulnerabilityIndex: "High",
    activeCorridors: 3,
  },
  nodes: [
    // Suppliers
    { id: "iraq",    name: "Iraq (SOMO)",    type: "supplier" as NodeType, risk: "medium" as RiskLevel, commodity: "Crude Oil", volume: "$18.2B/yr", volumeVal: 18.2, sharePct: "26%", detail: "Basrah crude supplies to Indian Oil & BPCL", contingency: "Increase spot purchase from UAE & Saudi", colIndex: 0, rowIndex: 0 },
    { id: "saudi",   name: "Saudi Arabia",   type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$14.1B/yr", volumeVal: 14.1, sharePct: "20%", detail: "Long-term Aramco contracts for West coast refiners", contingency: "Draw from ISPRL strategic reserves", colIndex: 0, rowIndex: 1 },
    { id: "russia",  name: "Russia (Urals)", type: "supplier" as NodeType, risk: "high"   as RiskLevel, commodity: "Crude Oil", volume: "$13.4B/yr", volumeVal: 13.4, sharePct: "19%", detail: "Heavy discounted Baltic & Black Sea crude", contingency: "Switch to West African & US sweet grades", colIndex: 0, rowIndex: 2 },
    { id: "uae",     name: "UAE (ADNOC)",    type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "Crude Oil", volume: "$8.3B/yr",  volumeVal: 8.3,  sharePct: "12%", detail: "Murban grade strategic crude partnership", contingency: "Utilize Padur underground SPR storage", colIndex: 0, rowIndex: 3 },
    { id: "qatar",   name: "QatarEnergy",    type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "LNG",       volume: "$5.1B/yr",  volumeVal: 5.1,  sharePct: "8%",  detail: "Petronet LNG Dahej & Kochi long-term supply", contingency: "Domestic gas allocation priority shift", colIndex: 0, rowIndex: 4 },
    { id: "usa",     name: "United States",  type: "supplier" as NodeType, risk: "low"    as RiskLevel, commodity: "WTI Crude", volume: "$3.8B/yr",  volumeVal: 3.8,  sharePct: "5%",  detail: "US Gulf Coast light tight oil exports", contingency: "Increase Atlantic spot charter allocation", colIndex: 0, rowIndex: 5 },

    // Primary Chokepoint
    { id: "hormuz",  name: "Strait of Hormuz", type: "chokepoint" as NodeType, risk: "high" as RiskLevel, commodity: "Gulf Supply", volume: "$45.7B/yr", volumeVal: 45.7, sharePct: "66%", detail: "Over 60% of India's crude import basket transits Hormuz", contingency: "Release 9.5 days ISPRL strategic petroleum reserve", colIndex: 1, rowIndex: 1.5 },

    // Secondary Corridors
    { id: "cape",    name: "Cape of Good Hope", type: "chokepoint" as NodeType, risk: "low"  as RiskLevel, commodity: "Russian / Atlantic", volume: "$17.2B/yr", volumeVal: 17.2, sharePct: "25%", detail: "Maritime bypass for Urals and West African crude", contingency: "Standard alternative route with +12-16 days transit", colIndex: 2, rowIndex: 3.8 },
    { id: "malacca", name: "Strait of Malacca", type: "chokepoint" as NodeType, risk: "medium" as RiskLevel, commodity: "Far East / US Flows", volume: "$6.3B/yr", volumeVal: 6.3, sharePct: "9%", detail: "East coast refiner approach from SE Asia / US routes", contingency: "Direct west-coast discharge & domestic pipeline transport", colIndex: 2, rowIndex: 1.0 },

    // Destinations
    { id: "mumbai",  name: "Mumbai / Jamnagar", type: "destination" as NodeType, risk: "low" as RiskLevel, commodity: "West Refineries", volume: "1.8M bbl/d", volumeVal: 38.0, sharePct: "55%", detail: "Reliance Jamnagar + BPCL/HPCL Mumbai cluster", contingency: "Direct SPR pipeline feed from Mangalore/Padur", colIndex: 3, rowIndex: 0.8 },
    { id: "paradip", name: "Paradip Port",      type: "destination" as NodeType, risk: "low" as RiskLevel, commodity: "IOCL Refinery",  volume: "300k bbl/d", volumeVal: 18.0, sharePct: "26%", detail: "East coast strategic hub for northern crude pipeline", contingency: "Cross-country pipeline reversal & coastal barging", colIndex: 3, rowIndex: 2.6 },
    { id: "vizag",   name: "Vizag Terminal & SPR", type: "destination" as NodeType, risk: "low" as RiskLevel, commodity: "SPR + HPCL",  volume: "1.33 MMT SPR", volumeVal: 13.2, sharePct: "19%", detail: "Strategic underground crude storage + refinery", contingency: "Activate emergency SPR injection & drawdown protocol", colIndex: 3, rowIndex: 4.4 },
  ],
  links: [
    { source: "iraq",    target: "hormuz",  commodity: "Crude Oil", volume: 18.2, risk: "medium" as RiskLevel },
    { source: "saudi",   target: "hormuz",  commodity: "Crude Oil", volume: 14.1, risk: "low"    as RiskLevel },
    { source: "uae",     target: "hormuz",  commodity: "Crude Oil", volume: 8.3,  risk: "low"    as RiskLevel },
    { source: "qatar",   target: "hormuz",  commodity: "LNG",       volume: 5.1,  risk: "low"    as RiskLevel },
    { source: "russia",  target: "cape",    commodity: "Crude Oil", volume: 13.4, risk: "high"   as RiskLevel },
    { source: "usa",     target: "cape",    commodity: "Crude Oil", volume: 3.8,  risk: "low"    as RiskLevel },
    { source: "hormuz",  target: "mumbai",  commodity: "Crude Oil", volume: 32.0, risk: "high"   as RiskLevel },
    { source: "hormuz",  target: "paradip", commodity: "Crude Oil", volume: 13.7, risk: "high"   as RiskLevel },
    { source: "cape",    target: "mumbai",  commodity: "Crude Oil", volume: 6.0,  risk: "medium" as RiskLevel },
    { source: "cape",    target: "vizag",   commodity: "Crude Oil", volume: 11.2, risk: "medium" as RiskLevel },
    { source: "malacca", target: "paradip", commodity: "Crude Oil", volume: 6.3,  risk: "low"    as RiskLevel },
  ],
};

// ---------------------------------------------------------------------------
// Theme & Palette
// ---------------------------------------------------------------------------
const RISK_COLORS: Record<RiskLevel, { stroke: string; fill: string; glow: string; text: string }> = {
  high:   { stroke: "#f43f5e", fill: "rgba(244, 63, 94, 0.15)", glow: "rgba(244, 63, 94, 0.6)", text: "#fda4af" },
  medium: { stroke: "#fbbf24", fill: "rgba(251, 191, 36, 0.15)", glow: "rgba(251, 191, 36, 0.5)", text: "#fde68a" },
  low:    { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.15)", glow: "rgba(16, 185, 129, 0.5)", text: "#a7f3d0" },
};

const TYPE_CONFIG = {
  supplier:    { title: "Supplier Origin", icon: Ship,    accent: "#38bdf8", bg: "#0369a1" },
  chokepoint:  { title: "Maritime Chokepoint", icon: Anchor,  accent: "#f43f5e", bg: "#be123c" },
  destination: { title: "Refining & Port Terminal", icon: Factory, accent: "#10b981", bg: "#047857" },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function EnergyDependencyGraph3D() {
  const { activeCountry } = useCountry();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [commodityFilter, setCommodityFilter] = useState<"ALL" | "CRUDE" | "LNG">("ALL");

  const graphData = activeCountry.id === "singapore" ? SINGAPORE_GRAPH : INDIA_GRAPH;

  // Filter links and nodes based on selected commodity
  const { activeNodes, activeLinks } = useMemo(() => {
    let filteredLinks = graphData.links;
    if (commodityFilter === "CRUDE") {
      filteredLinks = graphData.links.filter(l => l.commodity.toLowerCase().includes("crude") || l.commodity.toLowerCase().includes("feedstock"));
    } else if (commodityFilter === "LNG") {
      filteredLinks = graphData.links.filter(l => l.commodity.toLowerCase().includes("lng") || l.commodity.toLowerCase().includes("gas"));
    }

    const connectedNodeIds = new Set<string>();
    filteredLinks.forEach(l => {
      connectedNodeIds.add(l.source);
      connectedNodeIds.add(l.target);
    });

    const filteredNodes = graphData.nodes.filter(n => connectedNodeIds.has(n.id) || commodityFilter === "ALL");
    return { activeNodes: filteredNodes, activeLinks: filteredLinks };
  }, [graphData, commodityFilter]);

  // Reset selection on country change
  useEffect(() => {
    setSelectedNode(null);
    setHoveredNodeId(null);
  }, [activeCountry.id]);

  // Canvas Flow Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = 0;
    let particles: { linkIndex: number; progress: number; speed: number; size: number }[] = [];

    // Initialize particles based on link volume
    activeLinks.forEach((link, idx) => {
      const count = Math.max(2, Math.min(6, Math.floor(link.volume / 5)));
      for (let i = 0; i < count; i++) {
        particles.push({
          linkIndex: idx,
          progress: (i / count) + Math.random() * 0.2,
          speed: 0.003 + (link.volume / 5000),
          size: Math.max(2, Math.min(4, link.volume / 8)),
        });
      }
    });

    function render(width: number, height: number) {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      // Deterministic layout calculation
      const colX = [
        width * 0.12,  // Col 0: Suppliers
        width * 0.40,  // Col 1: Primary Chokepoint
        width * 0.65,  // Col 2: Secondary Corridors
        width * 0.88   // Col 3: Destinations
      ];

      const nodePos = new Map<string, { x: number; y: number; node: GraphNode; r: number }>();

      // Group nodes by column to compute precise non-overlapping Y coordinates
      const cols: GraphNode[][] = [[], [], [], []];
      activeNodes.forEach(node => {
        cols[node.colIndex]?.push(node);
      });

      cols.forEach((colNodes, colIdx) => {
        const total = colNodes.length;
        colNodes.forEach((node) => {
          const x = colX[colIdx];
          // Evenly spaced vertical distribution with healthy margins
          const y = height * 0.14 + (node.rowIndex / 5.2) * (height * 0.72);
          const r = node.type === "chokepoint" ? 28 : node.type === "destination" ? 24 : 20;
          nodePos.set(node.id, { x, y, node, r });
        });
      });

      // Find highlighted subgraph
      const highlightedNodeIds = new Set<string>();
      const highlightedLinkIndices = new Set<number>();

      const activeTargetId = hoveredNodeId || selectedNode?.id;

      if (activeTargetId) {
        highlightedNodeIds.add(activeTargetId);
        // Find upstream & downstream
        activeLinks.forEach((link, idx) => {
          if (link.source === activeTargetId || link.target === activeTargetId) {
            highlightedLinkIndices.add(idx);
            highlightedNodeIds.add(link.source);
            highlightedNodeIds.add(link.target);
          }
        });
      }

      function draw() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw subtle background coordinate grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // 2. Draw Column Zone Headers with glowing dashed dividers
        const colLabels = ["1. ENERGY SUPPLIERS", "2. PRIMARY CHOKEPOINT", "3. TRANSIT CORRIDORS", "4. STRATEGIC REFINERIES"];
        ctx.font = "bold 9px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        colLabels.forEach((label, i) => {
          const x = colX[i];
          ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
          ctx.fillText(label, x, 24);

          // Vertical guideline
          ctx.setLineDash([4, 8]);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
          ctx.beginPath();
          ctx.moveTo(x, 34);
          ctx.lineTo(x, height - 16);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // 3. Draw Fluid Cubic Bezier Connection Streams
        activeLinks.forEach((link, idx) => {
          const source = nodePos.get(link.source);
          const target = nodePos.get(link.target);
          if (!source || !target) return;

          const isHighlighted = activeTargetId ? highlightedLinkIndices.has(idx) : true;
          const riskStyle = RISK_COLORS[link.risk];

          // Compute smooth S-curve control points
          const dx = target.x - source.x;
          const cp1x = source.x + dx * 0.45;
          const cp1y = source.y;
          const cp2x = source.x + dx * 0.55;
          const cp2y = target.y;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);

          // Dynamic line thickness & opacity based on highlight state
          const baseWidth = Math.max(1.8, Math.min(6, link.volume / 6));
          ctx.lineWidth = isHighlighted ? (activeTargetId ? baseWidth + 1.5 : baseWidth) : 1;

          if (isHighlighted) {
            ctx.shadowColor = riskStyle.glow;
            ctx.shadowBlur = activeTargetId ? 16 : 8;
            const grad = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
            grad.addColorStop(0, riskStyle.stroke + (activeTargetId ? "dd" : "aa"));
            grad.addColorStop(0.5, riskStyle.stroke + (activeTargetId ? "ff" : "cc"));
            grad.addColorStop(1, riskStyle.stroke + (activeTargetId ? "dd" : "aa"));
            ctx.strokeStyle = grad;
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          }
          ctx.stroke();
          ctx.restore();
        });

        // 4. Update & Draw Animated Energy Pulses (Flow Particles)
        particles.forEach((p) => {
          const link = activeLinks[p.linkIndex];
          if (!link) return;

          const source = nodePos.get(link.source);
          const target = nodePos.get(link.target);
          if (!source || !target) return;

          const isHighlighted = activeTargetId ? highlightedLinkIndices.has(p.linkIndex) : true;
          const riskStyle = RISK_COLORS[link.risk];

          p.progress = (p.progress + p.speed) % 1;
          const t = p.progress;

          // Cubic Bezier interpolation: B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
          const dx = target.x - source.x;
          const cp1x = source.x + dx * 0.45;
          const cp1y = source.y;
          const cp2x = source.x + dx * 0.55;
          const cp2y = target.y;

          const cx = Math.pow(1 - t, 3) * source.x +
                     3 * Math.pow(1 - t, 2) * t * cp1x +
                     3 * (1 - t) * Math.pow(t, 2) * cp2x +
                     Math.pow(t, 3) * target.x;

          const cy = Math.pow(1 - t, 3) * source.y +
                     3 * Math.pow(1 - t, 2) * t * cp1y +
                     3 * (1 - t) * Math.pow(t, 2) * cp2y +
                     Math.pow(t, 3) * target.y;

          ctx.save();
          if (isHighlighted) {
            ctx.shadowColor = riskStyle.stroke;
            ctx.shadowBlur = 14;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(cx, cy, activeTargetId ? p.size + 1 : p.size, 0, Math.PI * 2);
            ctx.fill();

            // Outer energy halo
            ctx.fillStyle = riskStyle.stroke;
            ctx.beginPath();
            ctx.arc(cx, cy, (p.size * 1.8), 0, Math.PI * 2);
            ctx.globalAlpha = 0.4;
            ctx.fill();
          }
          ctx.restore();
        });

        // 5. Draw High-Tech Node Cards
        nodePos.forEach(({ x, y, node, r }) => {
          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isFaded = activeTargetId ? !highlightedNodeIds.has(node.id) : false;
          const riskStyle = RISK_COLORS[node.risk];
          const typeStyle = TYPE_CONFIG[node.type];

          ctx.save();
          ctx.globalAlpha = isFaded ? 0.25 : 1.0;

          // Outer Radar Pulse on High-Risk nodes
          if (node.risk === "high" && !isFaded) {
            const pulse = (Date.now() % 2000) / 2000;
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.6 * (1 - pulse)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r + pulse * 18, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Active Glow Halo
          if (isSelected || isHovered) {
            ctx.shadowColor = riskStyle.stroke;
            ctx.shadowBlur = 24;
            ctx.strokeStyle = riskStyle.stroke;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x, y, r + 4, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Node Circle Gradient Background
          const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
          grad.addColorStop(0, isSelected ? "#1e293b" : "#0f172a");
          grad.addColorStop(1, isSelected ? "#090d16" : "#020617");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();

          // Border Ring
          ctx.strokeStyle = isSelected || isHovered ? riskStyle.stroke : "rgba(255, 255, 255, 0.18)";
          ctx.lineWidth = isSelected || isHovered ? 2 : 1.2;
          ctx.stroke();

          // Inner Type Icon Emblem
          ctx.fillStyle = isSelected || isHovered ? "#ffffff" : riskStyle.text;
          ctx.font = `bold ${node.type === "chokepoint" ? "12px" : "10px"} Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const shortName = node.type === "chokepoint" ? "CHOKE" : node.type === "supplier" ? "SRC" : "DST";
          ctx.fillText(shortName, x, y - 1);

          // Status Risk Pip
          ctx.shadowColor = riskStyle.stroke;
          ctx.shadowBlur = 6;
          ctx.fillStyle = riskStyle.stroke;
          ctx.beginPath();
          ctx.arc(x + r * 0.7, y - r * 0.7, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Crisp Label Card Pill Underneath Node
          const labelY = y + r + 14;
          ctx.font = "bold 11px Inter, system-ui, sans-serif";
          const nameWidth = ctx.measureText(node.name).width;
          const cardWidth = Math.max(nameWidth + 16, 76);
          const cardHeight = 28;

          // Pill Background
          ctx.fillStyle = isSelected ? "rgba(30, 41, 59, 0.95)" : isHovered ? "rgba(15, 23, 42, 0.9)" : "rgba(2, 6, 23, 0.85)";
          ctx.strokeStyle = isSelected ? riskStyle.stroke : "rgba(255, 255, 255, 0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x - cardWidth / 2, labelY - 8, cardWidth, cardHeight, 6);
          ctx.fill();
          ctx.stroke();

          // Node Name
          ctx.fillStyle = isSelected ? "#ffffff" : isHovered ? "#f8fafc" : "#e2e8f0";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(node.name, x, labelY - 4);

          // Secondary Sub-tag (Volume or Share)
          ctx.font = "9px Inter, system-ui, sans-serif";
          ctx.fillStyle = riskStyle.text;
          ctx.fillText(node.volume, x, labelY + 9);

          ctx.restore();
        });
      }

      function loop() {
        draw();
        animId = requestAnimationFrame(loop);
      }
      animId = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        cancelAnimationFrame(animId);
        render(w, h);
      }
    });
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [activeNodes, activeLinks, hoveredNodeId, selectedNode]);

  // Hit-testing for Node Hover / Click
  function getNodeAt(clientX: number, clientY: number): GraphNode | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const width = rect.width;
    const height = rect.height;
    const colX = [width * 0.12, width * 0.40, width * 0.65, width * 0.88];

    for (const node of activeNodes) {
      const nx = colX[node.colIndex];
      const ny = height * 0.14 + (node.rowIndex / 5.2) * (height * 0.72);
      const r = node.type === "chokepoint" ? 28 : 22;

      // Check circle hit or label pill hit
      const distSq = Math.pow(x - nx, 2) + Math.pow(y - ny, 2);
      if (distSq <= (r + 14) * (r + 14)) return node;
      if (Math.abs(x - nx) < 45 && y >= ny + r && y <= ny + r + 40) return node;
    }
    return null;
  }

  return (
    <div className="relative flex flex-col rounded-2xl border border-white/10 bg-[#040711] shadow-2xl overflow-hidden" style={{ height: 600 }}>
      {/* Telemetry HUD Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md shrink-0">
        
        {/* Left: Summary Telemetry KPIs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="size-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Dependency</div>
              <div className="text-sm font-bold text-white tabular-nums">{graphData.stats.totalVolume}</div>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="size-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Chokepoint Risk</div>
              <div className="text-sm font-bold text-rose-400 tabular-nums">{graphData.stats.chokepointExposure} ({graphData.stats.vulnerabilityIndex})</div>
            </div>
          </div>
        </div>

        {/* Center: Commodity Filter Tabs */}
        <div className="flex items-center rounded-lg bg-white/[0.04] p-1 border border-white/8">
          {(["ALL", "CRUDE", "LNG"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setCommodityFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                commodityFilter === filter 
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {filter === "ALL" ? "All Energy" : filter === "CRUDE" ? "Crude Oil" : "LNG & Gas"}
            </button>
          ))}
        </div>

        {/* Right: Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> High Risk
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" /> Secure
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Topology Canvas */}
      <div className="flex-1 relative overflow-hidden bg-radial from-[#0c1222] to-[#040711]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: hoveredNodeId ? "pointer" : "default" }}
          onClick={(e) => {
            const node = getNodeAt(e.clientX, e.clientY);
            setSelectedNode(prev => prev?.id === node?.id ? null : node);
          }}
          onMouseMove={(e) => {
            const node = getNodeAt(e.clientX, e.clientY);
            setHoveredNodeId(node?.id ?? null);
          }}
          onMouseLeave={() => setHoveredNodeId(null)}
        />

        {/* Bottom Helper Note */}
        <div className="absolute bottom-3 left-6 flex items-center gap-2 text-[10px] text-slate-500 pointer-events-none">
          <Info className="size-3.5" />
          <span>Click any node to inspect flow paths, alternate routes, and contingency protocols.</span>
        </div>

        {/* Node Inspector Floating Modal Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-6 z-30 w-80 rounded-xl border border-white/15 bg-[#0b101e]/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    className="size-2 rounded-full" 
                    style={{ backgroundColor: RISK_COLORS[selectedNode.risk].stroke, boxShadow: `0 0 10px ${RISK_COLORS[selectedNode.risk].stroke}` }} 
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {TYPE_CONFIG[selectedNode.type].title}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-white">{selectedNode.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)} 
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-y border-white/10 py-3">
              <div className="rounded-lg bg-white/[0.03] p-2.5">
                <div className="text-[10px] text-slate-400">Volume / Capacity</div>
                <div className="text-sm font-bold text-white tabular-nums mt-0.5">{selectedNode.volume}</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2.5">
                <div className="text-[10px] text-slate-400">Share of Inflow</div>
                <div className="text-sm font-bold text-sky-400 tabular-nums mt-0.5">{selectedNode.sharePct}</div>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Commodity: </span>
                <span className="font-semibold text-slate-200">{selectedNode.commodity}</span>
              </div>
              <div>
                <span className="text-slate-400">Strategic Profile: </span>
                <p className="mt-1 text-slate-300 leading-relaxed text-[11px] bg-white/[0.02] p-2 rounded-md border border-white/5">
                  {selectedNode.detail}
                </p>
              </div>

              {selectedNode.contingency && (
                <div>
                  <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px] mt-2">
                    <Sparkles className="size-3" /> Contingency Protocol:
                  </span>
                  <p className="mt-1 text-amber-200/90 leading-relaxed text-[11px] bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                    {selectedNode.contingency}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
