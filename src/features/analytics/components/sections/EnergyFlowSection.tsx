"use client";

import { useCountry } from "@/hooks/useCountry";
import { EnergyFlowSankey } from "../EnergyFlowSankey";
import type { SankeyData } from "@/features/analytics/components/EnergyFlowSankey";
import { useMemo } from "react";

// Only include the most strategically relevant energy-flow nodes to keep the diagram readable.
const ENERGY_SUPPLIER_IDS = new Set([
  "country_saudi_arabia",
  "country_iraq",
  "country_uae",
  "country_russia",
  "country_iran",
  "country_qatar",
  "country_kuwait",
  "country_usa",
]);

const ENERGY_CORRIDOR_IDS = new Set([
  "corridor_hormuz",
  "corridor_bab_el_mandeb",
  "corridor_suez",
  "corridor_malacca",
]);

const ENERGY_PORT_IDS = new Set([
  "port_mundra",
  "port_jnpt",
  "port_kandla",
  "port_kochi",
  "port_mangalore",
  "port_chennai",
]);

// Singapore-specific
const SG_SUPPLIER_IDS = new Set([
  "country_saudi_arabia",
  "country_iraq",
  "country_uae",
  "country_russia",
  "country_qatar",
]);

const SG_CORRIDOR_IDS = new Set([
  "corridor_hormuz",
  "corridor_malacca",
  "corridor_south_china_sea",
]);

const SG_PORT_IDS = new Set([
  "port_jurong",
  "port_bukom",
  "port_singapore",
]);

export function EnergyFlowSection() {
  const { activeCountry } = useCountry();
  const isSingapore = activeCountry.id === "singapore";

  const allowedSuppliers = isSingapore ? SG_SUPPLIER_IDS : ENERGY_SUPPLIER_IDS;
  const allowedCorridors = isSingapore ? SG_CORRIDOR_IDS : ENERGY_CORRIDOR_IDS;
  const allowedPorts    = isSingapore ? SG_PORT_IDS     : ENERGY_PORT_IDS;

  const sankeyData = useMemo<SankeyData>(() => {
    const relevantGraphNodes = activeCountry.tradeGraph.filter((n: any) => {
      if (n.type === "country")  return allowedSuppliers.has(n.id);
      if (n.type === "corridor") return allowedCorridors.has(n.id);
      if (n.type === "port")     return allowedPorts.has(n.id);
      return false;
    });

    const nodes = relevantGraphNodes.map((n: any) => ({ name: n.label }));
    const idToIndex = new Map(relevantGraphNodes.map((n: any, i: number) => [n.id, i]));
    const links: { source: number; target: number; value: number }[] = [];

    for (const node of relevantGraphNodes) {
      const sourceIdx = idToIndex.get(node.id);
      if (sourceIdx === undefined) continue;

      for (const conn of node.connections) {
        const targetIdx = idToIndex.get(conn.targetId);
        if (targetIdx === undefined) continue;

        const targetNode = relevantGraphNodes[targetIdx];
        const isSupplierToCorridor = node.type === "country"  && targetNode.type === "corridor";
        const isCorridorToPort     = node.type === "corridor" && targetNode.type === "port";

        if (isSupplierToCorridor || isCorridorToPort) {
          let val = 10;
          if (conn.strategicWeight === "Critical") val = 80;
          else if (conn.strategicWeight === "High") val = 50;
          else if (conn.strategicWeight === "Medium") val = 20;

          if (targetNode.capacityMtpa) val = targetNode.capacityMtpa * (val / 100);
          else if (node.capacityMtpa)  val = node.capacityMtpa * (val / 100);

          links.push({ source: sourceIdx, target: targetIdx, value: val });
        }
      }
    }

    return { nodes, links, unit: "Mtpa" };
  }, [activeCountry.tradeGraph, allowedSuppliers, allowedCorridors, allowedPorts]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-[var(--text)]">Strategic Energy Flow</h3>
        <p className="text-sm text-[var(--text-dim)]">
          Crude oil and energy dependencies from top global suppliers through major maritime chokepoints to receiving ports. Drag corridors to reposition · click any node for detail.
        </p>
      </div>
      <div
        className="w-full overflow-hidden rounded-xl border border-[var(--panel-border)] p-4 shadow-sm"
        style={{ height: "520px", background: "#0b0f1a" }}
      >
        <EnergyFlowSankey data={sankeyData} compact={false} />
      </div>
    </div>
  );
}

