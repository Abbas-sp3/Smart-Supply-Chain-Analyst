import { INDIA_TRADE_GRAPH, KnowledgeGraphNode } from "./tradeGraph";

/**
 * These utils now accept an optional graph argument.
 * When called without a graph, they fall back to INDIA_TRADE_GRAPH
 * for backward-compatibility with modules that don't yet pass a country graph.
 * Pass `country.tradeGraph` to get country-specific results.
 */

export function findNodeByLabel(
  label: string,
  graph: KnowledgeGraphNode[] = INDIA_TRADE_GRAPH,
): KnowledgeGraphNode | undefined {
  const lowerLabel = label.toLowerCase();
  return graph.find((node) => {
    if (node.label.toLowerCase() === lowerLabel) return true;
    if (node.aliases?.some((alias) => alias.toLowerCase() === lowerLabel)) return true;
    // Fallback partial match for loose LLM outputs (e.g., "Mundra" matches "Mundra Port")
    if (
      node.label.toLowerCase().includes(lowerLabel) ||
      lowerLabel.includes(node.label.toLowerCase())
    )
      return true;
    return false;
  });
}

export function getAllNodesByType(
  type: KnowledgeGraphNode["type"],
  graph: KnowledgeGraphNode[] = INDIA_TRADE_GRAPH,
): KnowledgeGraphNode[] {
  return graph.filter((node) => node.type === type);
}
