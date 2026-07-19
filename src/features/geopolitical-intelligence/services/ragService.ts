import { pipeline, env } from '@xenova/transformers';
import { INDIA_TRADE_GRAPH } from '../knowledge-graph/indiaTradeGraph';
import { DISRUPTION_PRESETS } from '@/features/scenario-simulator/constants/disruption-presets';

// Suppress local file warnings for Xenova in node
env.allowLocalModels = false;
env.useBrowserCache = false;

export interface RagChunk {
  id: string;
  sourceLabel: string;
  text: string;
  embedding?: number[];
}

let corpus: RagChunk[] = [];
let embedder: any = null;

export async function initRagService() {
  if (corpus.length > 0) return; // already initialized
  
  // 1. Build corpus
  const chunks: RagChunk[] = [];
  
  // A. India Trade Graph Nodes
  for (const node of INDIA_TRADE_GRAPH) {
    const label = node.label || node.id;
    const text = `Node: ${label} (${node.type}). Description: ${node.description || 'N/A'}. Capacity: ${node.capacityMtpa || 'Unknown'} Mtpa. ${node.dataSource ? 'Source: ' + node.dataSource : ''}`;
    chunks.push({ id: `node_${node.id}`, sourceLabel: `Knowledge Graph: ${label}`, text });
  }

  // B. Disruption Presets & Historical Analogues
  for (const preset of DISRUPTION_PRESETS) {
    let text = `Scenario: ${preset.label}. Description: ${preset.description}. Severity: ${preset.severityPct}%. Expected duration: ${preset.expectedDurationDays} days.`;
    if (preset.historicalCalibrationCase) {
      const hc = preset.historicalCalibrationCase;
      text += ` Historical precedent: ${hc.eventName} (${hc.year}). Duration was ${hc.actualDurationDays} days. Source: ${hc.sourceDescription}.`;
    }
    chunks.push({ id: `preset_${preset.id}`, sourceLabel: `Scenario Preset: ${preset.label}`, text });
  }

  // C. Historical Precedent writeups (Suez, Red Sea)
  chunks.push({
    id: "hist_suez_2021",
    sourceLabel: "Historical Precedent: 2021 Suez Canal Blockage",
    text: "The 2021 Suez Canal blockage occurred when the Ever Given vessel grounded, closing the canal completely for 6 days. All traffic had to queue or reroute via the Cape of Good Hope. It caused a global trade disruption estimated at $9.6 billion per day."
  });
  chunks.push({
    id: "hist_red_sea_2024",
    sourceLabel: "Historical Precedent: 2024 Houthi Red Sea Attacks",
    text: "The 2024 Houthi attacks in the Red Sea forced major shipping lines to reroute via the Cape of Good Hope, adding 12-14 days to transit times and significantly increasing bunker fuel costs and insurance premiums. It acts as a major choke point for Europe-Asia trade."
  });
  
  // 2. Initialize embedder
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  // 3. Generate embeddings
  for (const chunk of chunks) {
    const output = await embedder(chunk.text, { pooling: 'mean', normalize: true });
    chunk.embedding = Array.from(output.data);
  }
  
  corpus = chunks;
}

function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
}

export async function queryRag(query: string) {
  await initRagService();
  
  const output = await embedder(query, { pooling: 'mean', normalize: true });
  const queryEmbedding = Array.from(output.data) as number[];
  
  // Score all chunks
  const scored = corpus.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding!)
  })).sort((a, b) => b.score - a.score);
  
  // Top 4 chunks
  const topChunks = scored.slice(0, 4);
  
  return topChunks;
}
