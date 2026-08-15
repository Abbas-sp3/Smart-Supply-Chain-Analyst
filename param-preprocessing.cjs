const fs = require('fs');

let content = fs.readFileSync('src/features/geopolitical-intelligence/services/preprocessingService.ts', 'utf-8');

// 1. imports
content = content.replace(/import \{.*?buildKnowledgeGraphContext,.*?type KnowledgeGraphResult,.*?\} from \"..\/knowledge-graph\";/s, 
  `import { buildKnowledgeGraphContext, type KnowledgeGraphResult } from "../knowledge-graph";
import type { CountryProfile } from "@/data/countries/types";`);

// 2. preprocessIntelligence signature
content = content.replace(/export async function preprocessIntelligence\(\n  rawSources: unknown\[\],\n\): Promise<AugmentedObservation\[\]> \{/, 
  `export async function preprocessIntelligence(\n  rawSources: unknown[],\n  country: CountryProfile\n): Promise<AugmentedObservation[]> {`);

// 3. extractNewsFacts signature
content = content.replace(/async function extractNewsFacts\(newsData: unknown\[\]\): Promise<NewsFact\[\]> \{/, 
  `async function extractNewsFacts(newsData: unknown[], country: CountryProfile): Promise<NewsFact[]> {`);

content = content.replace(/const prompt = \`You are a Fact Extraction engine for a Supply Chain Intelligence system focused on India's imports./, 
  `const prompt = \`You are a Fact Extraction engine for a Supply Chain Intelligence system focused on \${country.name}'s imports.`);

content = content.replace(/const newsFacts = await extractNewsFacts\(newsData\);/, 
  `const newsFacts = await extractNewsFacts(newsData, country);`);

// 4. buildIntelligenceContext signature in intelligenceService is already patched by the param-intelligence script. We just need to make sure buildIntelligenceContext in preprocessingService is exported? Wait, buildIntelligenceContext is not in preprocessingService, it's in intelligenceService... actually let's check.
fs.writeFileSync('src/features/geopolitical-intelligence/services/preprocessingService.ts', content);
console.log('preprocessingService updated');
