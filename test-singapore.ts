import { config } from 'dotenv';
config({ path: '.env.local' });
import { runPropagation } from './src/features/scenario-simulator/services/propagationEngine';
import { generateOptimizationStrategy } from './src/features/strategic-reserve/services/optimizationEngine';
import { queryRag } from './src/features/geopolitical-intelligence/services/ragService';
import { singaporeProfile } from './src/data/countries/singapore';
import { indiaProfile } from './src/data/countries/india';

async function main() {
  const preset = singaporeProfile.disruptionPresets.find(p => p.id === 'malacca_closure');
  if (!preset) throw new Error("Preset not found");
  
  const prop = runPropagation(preset, [], singaporeProfile);
  const opt = generateOptimizationStrategy(prop, singaporeProfile);
  
  console.log('--- SINGAPORE PROPAGATION & OPTIMIZATION ---');
  console.log('Supply Gap (Mtpa):', prop.metrics.supplyGapMtpa.likely);
  console.log('Recommend Release:', opt.recommendRelease);
  console.log('Reasoning:', opt.reasoning);
  console.log('Recommended Daily Rate (Mtpa):', opt.recommendedDailyRateMtpa);
  console.log('Days to Floor:', opt.daysToFloor);
  
  const impact = prop.nodeImpacts.find(n => n.nodeId === 'corridor_malacca');
  console.log('Malacca Spare Capacity (Mtpa):', impact?.spareCapacityMtpa);
  console.log('Malacca Locked Volume (Mtpa):', impact?.lockedVolumeMtpa);

  console.log('\n--- SINGAPORE RAG QUERY ---');
  const ragResults = await queryRag('Impact of the blockage of Malacca', singaporeProfile);
  console.log(ragResults.map((r: any) => ({ id: r.id, score: r.score })));

  console.log('\n--- CROSS POLLUTION CHECK ---');
  console.log('Do any results contain Hormuz or India tags?');
  const hasIndia = ragResults.some((r: any) => r.id.includes('hormuz') || r.text.toLowerCase().includes('india') || r.id.includes('isprl'));
  console.log('Has India/Hormuz leaked:', hasIndia);
}
main().catch(console.error);
