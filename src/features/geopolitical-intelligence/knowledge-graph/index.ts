/**
 * Knowledge Graph Engine — Structured entity matching and supply chain tracing.
 *
 * Two core functions:
 *  1. buildKnowledgeGraphContext() — scans text for entity mentions, returns structured matches
 *  2. traceSupplyChainImpact()     — walks the graph from matched nodes to derive the
 *     full supply chain exposure (products → categories → ports → industries → infrastructure → alternatives)
 */

import type { DataSourceOutput } from "../types";
import {
  INDIA_TRADE_GRAPH,
  ALTERNATIVE_SUPPLIERS,
  type KnowledgeGraphNode,
  type AlternativeSupplierMapping,
} from "./indiaTradeGraph";

// ─────────────────────────────────────────────────────────────────────────────
// Public types — consumed by intelligenceContextService
// ─────────────────────────────────────────────────────────────────────────────

export type MatchedEntity = {
  id: string;
  type: KnowledgeGraphNode["type"];
  label: string;
  description: string;
};

export type SupplyChainExposure = {
  affected_countries: Array<{ country: string; reason: string }>;
  affected_products: Array<{ product: string; reason: string }>;
  affected_import_categories: Array<{ category: string; reason: string }>;
  affected_ports: Array<{ port: string; reason: string }>;
  affected_industries: Array<{ industry: string; reason: string }>;
  affected_corridors: Array<{ corridor: string; reason: string }>;
  critical_infrastructure: Array<{ infrastructure: string; risk: string }>;
  alternative_suppliers: Array<{
    product: string;
    current_source: string;
    alternative_sources: string[];
    reason: string;
  }>;
};

export type KnowledgeGraphResult = {
  matched_entities: MatchedEntity[];
  supply_chain_exposure: SupplyChainExposure;
  strategic_context_summary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const nodeMap = new Map<string, KnowledgeGraphNode>();
for (const node of INDIA_TRADE_GRAPH) {
  nodeMap.set(node.id, node);
}

function matchesText(node: KnowledgeGraphNode, text: string): boolean {
  const lower = text.toLowerCase();
  // Match by label
  if (lower.includes(node.label.toLowerCase())) return true;
  // Match by aliases
  if (node.aliases) {
    for (const alias of node.aliases) {
      if (lower.includes(alias.toLowerCase())) return true;
    }
  }
  return false;
}

/**
 * Scans intelligence sources for entity mentions.
 * Returns the set of directly matched KG nodes.
 */
function findMatchedEntities(sources: DataSourceOutput[]): KnowledgeGraphNode[] {
  const allText = sources
    .map((s) =>
      typeof s.data === "string"
        ? s.data.toLowerCase()
        : JSON.stringify(s.data).toLowerCase(),
    )
    .join(" ");

  return INDIA_TRADE_GRAPH.filter((node) => matchesText(node, allText));
}

// ─────────────────────────────────────────────────────────────────────────────
// Supply Chain Tracing — walks the graph from matched nodes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a set of directly matched nodes, trace through the graph to find all
 * downstream supply chain impacts for India.
 */
export function traceSupplyChainImpact(
  matchedNodes: KnowledgeGraphNode[],
): SupplyChainExposure {
  const visited = new Set<string>();
  const reachableNodes = new Map<string, { node: KnowledgeGraphNode; reason: string }>();

  // BFS from every matched node, following connections up to 3 hops
  const queue: Array<{ nodeId: string; depth: number; reason: string }> = [];

  for (const node of matchedNodes) {
    visited.add(node.id);
    reachableNodes.set(node.id, { node, reason: `Directly mentioned in intelligence` });
    for (const edge of node.connections) {
      if (!visited.has(edge.targetId)) {
        const target = nodeMap.get(edge.targetId);
        if (target) {
          queue.push({
            nodeId: edge.targetId,
            depth: 1,
            reason: `${node.label} ${edge.relationship} ${target.label}`,
          });
        }
      }
    }
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    if (visited.has(item.nodeId)) continue;
    if (item.depth > 3) continue;

    visited.add(item.nodeId);
    const node = nodeMap.get(item.nodeId);
    if (!node) continue;

    reachableNodes.set(item.nodeId, { node, reason: item.reason });

    for (const edge of node.connections) {
      if (!visited.has(edge.targetId)) {
        const target = nodeMap.get(edge.targetId);
        if (target) {
          queue.push({
            nodeId: edge.targetId,
            depth: item.depth + 1,
            reason: `${node.label} ${edge.relationship} ${target.label}`,
          });
        }
      }
    }
  }

  // Also trace reverse connections: find nodes that DEPEND ON matched nodes
  for (const node of INDIA_TRADE_GRAPH) {
    if (visited.has(node.id)) continue;
    for (const edge of node.connections) {
      if (matchedNodes.some((m) => m.id === edge.targetId)) {
        if (!visited.has(node.id)) {
          visited.add(node.id);
          const target = nodeMap.get(edge.targetId);
          reachableNodes.set(node.id, {
            node,
            reason: `${node.label} ${edge.relationship} ${target?.label ?? edge.targetId}`,
          });
        }
      }
    }
  }

  // Bucket reachable nodes by type
  const countries: SupplyChainExposure["affected_countries"] = [];
  const products: SupplyChainExposure["affected_products"] = [];
  const categories: SupplyChainExposure["affected_import_categories"] = [];
  const ports: SupplyChainExposure["affected_ports"] = [];
  const industries: SupplyChainExposure["affected_industries"] = [];
  const corridors: SupplyChainExposure["affected_corridors"] = [];
  const infrastructure: SupplyChainExposure["critical_infrastructure"] = [];

  for (const [, { node, reason }] of reachableNodes) {
    switch (node.type) {
      case "country":
        if (node.id !== "country_india") {
          countries.push({ country: node.label, reason });
        }
        break;
      case "product":
        products.push({ product: node.label, reason });
        break;
      case "category":
        categories.push({ category: node.label, reason });
        break;
      case "port":
        ports.push({ port: node.label, reason });
        break;
      case "industry":
        industries.push({ industry: node.label, reason });
        break;
      case "corridor":
        corridors.push({ corridor: node.label, reason });
        break;
      case "infrastructure":
        infrastructure.push({ infrastructure: node.label, risk: reason });
        break;
    }
  }

  // Find alternative suppliers for affected products
  const affectedProductIds = new Set(
    [...reachableNodes.entries()]
      .filter(([, v]) => v.node.type === "product")
      .map(([id]) => id),
  );

  const affectedCountryIds = new Set(
    [...reachableNodes.entries()]
      .filter(([, v]) => v.node.type === "country")
      .map(([id]) => id),
  );

  const alternatives: SupplyChainExposure["alternative_suppliers"] = [];

  for (const mapping of ALTERNATIVE_SUPPLIERS) {
    if (!affectedProductIds.has(mapping.productId)) continue;

    // Find which current sources are affected
    const currentSources = mapping.alternatives
      .filter((alt) => affectedCountryIds.has(alt.countryId))
      .map((alt) => alt.countryLabel);

    // Find alternatives NOT in the affected set
    const availableAlts = mapping.alternatives
      .filter((alt) => !affectedCountryIds.has(alt.countryId))
      .map((alt) => `${alt.countryLabel} (${alt.viability}: ${alt.notes})`);

    if (currentSources.length > 0 && availableAlts.length > 0) {
      alternatives.push({
        product: mapping.productLabel,
        current_source: currentSources.join(", "),
        alternative_sources: availableAlts,
        reason: `Disruption to ${currentSources.join("/")} supply; alternatives available`,
      });
    } else if (availableAlts.length > 0) {
      // Product is affected but no specific country disruption — still provide alternatives
      alternatives.push({
        product: mapping.productLabel,
        current_source: "Multiple sources",
        alternative_sources: availableAlts.slice(0, 3),
        reason: `Potential supply disruption via affected corridors`,
      });
    }
  }

  return {
    affected_countries: countries,
    affected_products: products,
    affected_import_categories: categories,
    affected_ports: ports,
    affected_industries: industries,
    affected_corridors: corridors,
    critical_infrastructure: infrastructure,
    alternative_suppliers: alternatives,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scans collected intelligence sources for entity mentions, traces the full
 * supply chain impact, and returns a structured result for the LLM context.
 */
export function buildKnowledgeGraphContext(
  sources: DataSourceOutput[],
): KnowledgeGraphResult {
  const matchedNodes = findMatchedEntities(sources);

  if (matchedNodes.length === 0) {
    return {
      matched_entities: [],
      supply_chain_exposure: {
        affected_countries: [],
        affected_products: [],
        affected_import_categories: [],
        affected_ports: [],
        affected_industries: [],
        affected_corridors: [],
        critical_infrastructure: [],
        alternative_suppliers: [],
      },
      strategic_context_summary:
        "No predefined strategic knowledge graph relationships detected in current sources.",
    };
  }

  const exposure = traceSupplyChainImpact(matchedNodes);

  // Build a concise summary for the LLM
  const summaryParts: string[] = [];
  summaryParts.push(
    `STRATEGIC KNOWLEDGE GRAPH — ${matchedNodes.length} entities detected in intelligence sources.`,
  );
  if (exposure.affected_corridors.length > 0) {
    summaryParts.push(
      `Corridors at risk: ${exposure.affected_corridors.map((c) => c.corridor).join(", ")}.`,
    );
  }
  if (exposure.affected_products.length > 0) {
    summaryParts.push(
      `Products exposed: ${exposure.affected_products.map((p) => p.product).join(", ")}.`,
    );
  }
  if (exposure.affected_ports.length > 0) {
    summaryParts.push(
      `Indian ports affected: ${exposure.affected_ports.map((p) => p.port).join(", ")}.`,
    );
  }
  if (exposure.affected_industries.length > 0) {
    summaryParts.push(
      `Industries impacted: ${exposure.affected_industries.map((i) => i.industry).join(", ")}.`,
    );
  }
  if (exposure.critical_infrastructure.length > 0) {
    summaryParts.push(
      `Infrastructure at risk: ${exposure.critical_infrastructure.map((i) => i.infrastructure).join(", ")}.`,
    );
  }

  return {
    matched_entities: matchedNodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description,
    })),
    supply_chain_exposure: exposure,
    strategic_context_summary: summaryParts.join(" "),
  };
}

/**
 * Looks up alternative suppliers for a given product ID.
 */
export function getAlternativeSuppliersForProduct(
  productId: string,
): AlternativeSupplierMapping | undefined {
  return ALTERNATIVE_SUPPLIERS.find((m) => m.productId === productId);
}
