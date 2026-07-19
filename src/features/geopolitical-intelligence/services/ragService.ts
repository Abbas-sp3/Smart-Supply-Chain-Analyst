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
    text: "The 2021 Suez Canal blockage occurred when the Ever Given container vessel grounded on March 23, 2021, closing the canal completely for 6 days until March 29, 2021. All traffic had to queue or reroute via the Cape of Good Hope. Lloyd's List estimated the trade disruption at approximately $9.6 billion per day — this is a modelled estimate, not a measured cost. UNCTAD published analysis of cascading supply chain effects. Sources: Lloyd's List (March 2021), UNCTAD Policy Brief (April 2021)."
  });
  chunks.push({
    id: "hist_red_sea_2024",
    sourceLabel: "Historical Precedent: 2024 Houthi Red Sea Attacks",
    text: "Beginning late 2023 and escalating through 2024, Houthi attacks in the Red Sea forced major shipping lines — including Maersk, MSC, and CMA CGM — to reroute via the Cape of Good Hope, adding 12-14 days to Asia-Europe transit times. Bunker fuel costs and war-risk insurance premiums rose significantly. UNCTAD reported a sharp decline in Suez Canal transits. For India, the rerouting increased freight costs and extended lead times on European goods imports. Sources: UNCTAD Global Supply Chain report (January 2024), Freightos Baltic Index, Maersk/MSC public statements (December 2023 – January 2024)."
  });

  // ── September 2019 Saudi Aramco Abqaiq Attack — India LPG Impact ──
  chunks.push({
    id: "hist_aramco_2019",
    sourceLabel: "Historical Precedent: September 2019 Saudi Aramco Abqaiq Attack",
    text: `On September 14, 2019, drone and missile attacks on Saudi Aramco's Abqaiq and Khurais facilities temporarily cut Saudi oil production by approximately 5.7 million barrels per day — roughly 5% of global daily supply. Brent crude opened approximately 15-20% higher on September 16, 2019, the largest single-day percentage spike in decades. Saudi production was largely restored by early October 2019, limiting the duration of the shock. For India, which imports over 80% of its crude requirements, the event highlighted concentration risk in Gulf sourcing. Indian OMCs sought supply diversification in the immediate aftermath. Analysts regularly cited that every $1 increase in oil price raised India's annual import bill by approximately Rs 10,700 crore — a figure used in parliamentary and MoPNG commentary. Sources: U.S. Energy Information Administration (EIA, September 2019), Reuters, BBC, MoPNG Parliamentary responses.`
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
