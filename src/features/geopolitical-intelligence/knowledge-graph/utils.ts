import { INDIA_TRADE_GRAPH, KnowledgeGraphNode } from "./indiaTradeGraph";

export function findNodeByLabel(label: string): KnowledgeGraphNode | undefined {
  const lowerLabel = label.toLowerCase();
  return INDIA_TRADE_GRAPH.find((node) => {
    if (node.label.toLowerCase() === lowerLabel) return true;
    if (node.aliases?.some((alias) => alias.toLowerCase() === lowerLabel)) return true;
    // Fallback partial match for loose LLM outputs (e.g., "Mundra" matches "Mundra Port")
    if (node.label.toLowerCase().includes(lowerLabel) || lowerLabel.includes(node.label.toLowerCase())) return true;
    return false;
  });
}

export function getAllNodesByType(type: KnowledgeGraphNode["type"]): KnowledgeGraphNode[] {
  return INDIA_TRADE_GRAPH.filter((node) => node.type === type);
}
