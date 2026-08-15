const fs = require('fs');

let content = fs.readFileSync('src/features/geopolitical-intelligence/services/intelligenceService.ts', 'utf-8');

// 1. Update imports
content = content.replace(/import \{.*?\} from \"..\/schemas\/intelligence.schema\";/, 
  `import { intelligenceReportSchema } from "../schemas/intelligence.schema";
import type { CountryProfile } from "@/data/countries/types";`);
// Note: we can just add the import at the top

// 2. Update cache structure
content = content.replace(/type GlobalIntelligenceState = typeof globalThis & \{.*?\};/s, 
  `type GlobalIntelligenceState = typeof globalThis & {
  __intelligenceCache?: Record<string, CacheEntry>;
  __intelligenceInProgress?: Record<string, Promise<IntelligenceReport>>;
};`);

// 3. Update getCached
content = content.replace(/function getCached\(\): IntelligenceReport \| null \{[\s\S]*?\}/, 
  `function getCached(countryId: string): IntelligenceReport | null {
  const entry = globalStore.__intelligenceCache?.[countryId];
  if (!entry) return null;
  if (Date.now() - entry.generatedAt > INTELLIGENCE_CACHE_TTL_MS) return null;
  return entry.report;
}`);

// 4. Update getIntelligenceCacheTimestamp
content = content.replace(/export function getIntelligenceCacheTimestamp\(\): number \{[\s\S]*?\}/, 
  `export function getIntelligenceCacheTimestamp(countryId: string): number {
  return globalStore.__intelligenceCache?.[countryId]?.generatedAt || 0;
}`);

// 5. Update setCache
content = content.replace(/function setCache\(report: IntelligenceReport\): void \{[\s\S]*?\}/, 
  `function setCache(countryId: string, report: IntelligenceReport): void {
  if (!globalStore.__intelligenceCache) globalStore.__intelligenceCache = {};
  globalStore.__intelligenceCache[countryId] = { report, generatedAt: Date.now() };
}`);

// 6. Update generateFresh
content = content.replace(/async function generateFresh\(\): Promise<IntelligenceReport> \{/, 
  `async function generateFresh(country: CountryProfile): Promise<IntelligenceReport> {`);

content = content.replace(/DATA_SOURCES\.map\(\(plugin\) => plugin\.fetch\(\)\),/, 
  `DATA_SOURCES.map((plugin) => plugin.fetch(country)),`);

content = content.replace(/await preprocessIntelligence\(allSources\);/, 
  `await preprocessIntelligence(allSources, country);`);

content = content.replace(/buildIntelligenceContext\(augmentedObservations, allSources\);/, 
  `buildIntelligenceContext(augmentedObservations, allSources, country);`);

content = content.replace(/runExecutiveSummaryModule\(context\)/, 
  `runExecutiveSummaryModule(context, country)`);

content = content.replace(/runSupplyChainImpactModule\(context\)/, 
  `runSupplyChainImpactModule(context, country)`);

content = content.replace(/runRecommendationsModule\(context\)/, 
  `runRecommendationsModule(context, country)`);

content = content.replace(/runScenarioAnalysisModule\(context, contextHash\)/, 
  `runScenarioAnalysisModule(context, contextHash, country)`);

content = content.replace(/runEvidenceModule\(context\)/, 
  `runEvidenceModule(context, country)`);

content = content.replace(/export async function getIntelligenceReport\(\): Promise<IntelligenceReport> \{[\s\S]*?\}/,
  `export async function getIntelligenceReport(country: CountryProfile): Promise<IntelligenceReport> {
  const cached = getCached(country.id);
  if (cached) {
    console.log("[intelligenceService] Serving cached report for", country.id);
    return cached;
  }

  if (!globalStore.__intelligenceInProgress) {
    globalStore.__intelligenceInProgress = {};
  }
  
  if (globalStore.__intelligenceInProgress[country.id]) {
    console.log("[intelligenceService] Attaching to in-progress generation for", country.id);
    return globalStore.__intelligenceInProgress[country.id];
  }

  const promise = generateFresh(country)
    .then((report) => {
      setCache(country.id, report);
      return report;
    })
    .finally(() => {
      if (globalStore.__intelligenceInProgress) {
        delete globalStore.__intelligenceInProgress[country.id];
      }
    });

  globalStore.__intelligenceInProgress[country.id] = promise;
  return promise;
}`);

fs.writeFileSync('src/features/geopolitical-intelligence/services/intelligenceService.ts', content);
console.log('intelligenceService updated');
