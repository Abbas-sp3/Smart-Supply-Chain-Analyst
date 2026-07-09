import type { DataSourceOutput } from "../types";
import { INDIA_TRADE_GRAPH } from "./indiaTradeGraph";

/**
 * Scans collected intelligence sources for entity mentions and builds a 
 * compact context block of known strategic relationships for the AI prompt.
 */
export function buildKnowledgeGraphContext(sources: DataSourceOutput[]): string {
  const allText = sources
    .map((s) => (typeof s.data === "string" ? s.data.toLowerCase() : JSON.stringify(s.data).toLowerCase()))
    .join(" ");
  
  // Find all nodes mentioned in the text
  const activeNodes = INDIA_TRADE_GRAPH.filter((node) => {
    const labelLower = node.label.toLowerCase();
    // Simple substring match for demonstration. 
    // In a real system, this would use NLP or more robust keyword aliases.
    return allText.includes(labelLower) || 
           // Add some common aliases for matching
           (labelLower === "strait of hormuz" && allText.includes("hormuz")) ||
           (labelLower === "bab-el-mandeb strait / red sea" && (allText.includes("bab-el-mandeb") || allText.includes("red sea"))) ||
           (labelLower === "united states" && (allText.includes("usa") || allText.includes("us "))) ||
           (labelLower === "united arab emirates" && (allText.includes("uae"))) ||
           (labelLower === "liquefied natural gas (lng)" && (allText.includes("lng")));
  });

  if (activeNodes.length === 0) {
    return "No predefined strategic knowledge graph relationships detected in current sources.";
  }

  let context = "STRATEGIC KNOWLEDGE GRAPH CONTEXT (India's Supply Chain Dependencies):\n";
  context += "The following established relationships are relevant to the events described in the sources:\n\n";

  activeNodes.forEach((node) => {
    if (node.connections.length > 0) {
      context += `- ${node.label} (${node.type}): ${node.description}\n`;
      node.connections.forEach((edge) => {
        const targetNode = INDIA_TRADE_GRAPH.find((n) => n.id === edge.targetId);
        if (targetNode) {
          context += `  -> [${edge.strategicWeight} impact] ${edge.relationship} ${targetNode.label}\n`;
        }
      });
    }
  });

  return context;
}
