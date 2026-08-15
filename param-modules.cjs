const fs = require('fs');

const modules = [
  { name: 'executiveSummaryModule', func: 'runExecutiveSummaryModule', promptFuncs: ['buildExecutiveSummaryUserPrompt'], modType: 'executive' },
  { name: 'supplyChainImpactModule', func: 'runSupplyChainImpactModule', promptFuncs: ['buildSupplyChainImpactUserPrompt'], modType: 'supplyChain' },
  { name: 'recommendationsModule', func: 'runRecommendationsModule', promptFuncs: ['buildRecommendationsUserPrompt'], modType: 'recommendations' },
  { name: 'scenarioAnalysisModule', func: 'runScenarioAnalysisModule', promptFuncs: ['buildScenarioAnalysisUserPrompt'], modType: 'scenario' },
  { name: 'evidenceModule', func: 'runEvidenceModule', promptFuncs: ['buildEvidenceUserPrompt'], modType: 'evidence' }
];

for (const m of modules) {
  const path = `src/features/geopolitical-intelligence/modules/${m.name}.ts`;
  let content = fs.readFileSync(path, 'utf-8');
  
  // Replace old constant imports with buildSystemPrompt
  content = content.replace(/import \{.*?\} from "\.\.\/prompts\/module-prompts";/, 
  `import { buildSystemPrompt, ${m.promptFuncs[0]} } from "../prompts/module-prompts";
import { CountryProfile } from "@/data/countries/types";`);
  
  // Update function signature to accept country
  if (m.name === 'scenarioAnalysisModule') {
    content = content.replace(`export async function ${m.func}(\n  context: IntelligenceContext,\n  contextHash: string,\n)`, `export async function ${m.func}(\n  context: IntelligenceContext,\n  contextHash: string,\n  country: CountryProfile\n)`);
  } else {
    content = content.replace(`export async function ${m.func}(\n  context: IntelligenceContext,\n)`, `export async function ${m.func}(\n  context: IntelligenceContext,\n  country: CountryProfile\n)`);
  }
  
  // Update LLM call to use buildSystemPrompt
  content = content.replace(/system: [A-Z_]+,/, `system: buildSystemPrompt(country, '${m.modType}'),`);
  
  // Update user prompt to pass country
  content = content.replace(`${m.promptFuncs[0]}(context)`, `${m.promptFuncs[0]}(context, country)`);
  
  fs.writeFileSync(path, content);
}
console.log('Modules updated');
