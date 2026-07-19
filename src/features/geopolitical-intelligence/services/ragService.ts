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
    text: "The 2021 Suez Canal blockage occurred when the Ever Given vessel grounded, closing the canal completely for 6 days. All traffic had to queue or reroute via the Cape of Good Hope. It caused a global trade disruption estimated at $9.6 billion per day. Sources: Lloyd's List, UNCTAD, Oxford Economics."
  });
  chunks.push({
    id: "hist_red_sea_2024",
    sourceLabel: "Historical Precedent: 2024 Houthi Red Sea Attacks",
    text: "The 2024 Houthi attacks in the Red Sea forced major shipping lines to reroute via the Cape of Good Hope, adding 12-14 days to transit times and significantly increasing bunker fuel costs and insurance premiums. It acts as a major choke point for Europe-Asia trade."
  });

  // ── Newly added: July 2026 US-Iran Hormuz Naval Blockade ──
  chunks.push({
    id: "hist_iran_hormuz_2026",
    sourceLabel: "Historical Precedent: July 2026 US-Iran Hormuz Naval Blockade",
    text: `On July 13, 2026, President Trump reinstated a U.S. naval blockade targeting Iranian shipping, citing the need to secure the Strait of Hormuz. Brent crude surged approximately 9.4% in a single session, rising from a baseline of ~$70-80/bbl to ~$83/bbl, then reaching $85-88/bbl by mid-July 2026 — the highest in several weeks. A proposed 20% U.S. toll on all Hormuz transit cargo was announced and abandoned within 24 hours under international pressure. Indian refiners responded by accelerating spot-market sourcing and diversifying crude via Russia and UAE/Oman routing. India's government reported that approximately 70% of India's crude oil imports were being sourced outside the Strait of Hormuz as a strategic hedge. Retail petrol and diesel prices in India were held steady by state-run OMCs despite the crude spike (Delhi petrol: Rs 102.12/litre as of July 19, 2026). Sources: Gulf News, India Today, NewsonAir (Indian government), NDTV Profit, Axios (July 2026).`
  });

  // ── Newly added: September 2019 Saudi Aramco Abqaiq Attack — India LPG Impact ──
  chunks.push({
    id: "hist_aramco_2019",
    sourceLabel: "Historical Precedent: September 2019 Saudi Aramco Abqaiq Attack — India LPG Impact",
    text: `On September 14, 2019, drone and missile attacks on Saudi Aramco's Abqaiq and Khurais facilities temporarily cut Saudi oil production by 5.7 million barrels per day (approximately 5-6% of global supply). Brent crude surged nearly 20% in the immediate aftermath. India, which imports over 80% of its crude requirements, faced direct downstream consequences specifically in the LPG sector: Saudi Arabia is a key LPG supplier to India, and the attacks caused deferred LPG shipments. Business Standard and Business Today reported booking backlogs and delivery delays for LPG cylinders in some Indian states, coinciding with the festive season. Indian Oil Marketing Companies (IOC, BPCL, HPCL) sourced emergency LPG cargoes from ADNOC (Abu Dhabi National Oil Company) to bridge the gap. Saudi production was largely restored by early October 2019, limiting the duration of the supply shock. Analysts noted that every $1 increase in oil price raised India's annual import bill by approximately Rs 10,700 crore. Sources: Business Standard, Business Today, The Hindu, Baker Institute (September-October 2019).`
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
