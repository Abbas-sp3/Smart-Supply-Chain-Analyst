import { config } from 'dotenv';
config({ path: '.env.local' });
import { runPropagation } from './src/features/scenario-simulator/services/propagationEngine';
import { generateOptimizationStrategy } from './src/features/strategic-reserve/services/optimizationEngine';
import { getPresetById } from './src/features/scenario-simulator/constants/disruption-presets';
import { queryRag } from './src/features/geopolitical-intelligence/services/ragService';
import { indiaProfile } from './src/data/countries/india';

async function main() {
  const preset = getPresetById('hormuz_full_closure');
  if (!preset) throw new Error("Preset not found");
  
  const prop = runPropagation(preset, [], indiaProfile);
  const opt = generateOptimizationStrategy(prop, indiaProfile);
  
  console.log('--- PROPAGATION & OPTIMIZATION ---');
  console.log('Supply Gap (Mtpa):', prop.metrics.supplyGapMtpa.likely);
  console.log('Recommend Release:', opt.recommendRelease);
  console.log('Reasoning:', opt.reasoning);
  
  const impact = prop.nodeImpacts.find(n => n.nodeId === 'corridor_hormuz');
  console.log('Hormuz Spare Capacity (Mtpa):', impact?.spareCapacityMtpa);
  console.log('Hormuz Locked Volume (Mtpa):', impact?.lockedVolumeMtpa);

  console.log('\n--- RAG QUERY ---');
  const ragResults = await queryRag('Impact of the blockage of hormuz', indiaProfile);
  console.log(ragResults.map((r: any) => ({ id: r.id, score: r.score })));
}
main().catch(console.error).finally(() => process.exit(0));
