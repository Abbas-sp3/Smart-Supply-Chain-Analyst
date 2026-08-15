import { config } from 'dotenv';
config({ path: '.env.local' });
import { queryRag } from './src/features/geopolitical-intelligence/services/ragService';
import { singaporeProfile } from './src/data/countries/singapore';
import { indiaProfile } from './src/data/countries/india';
import { CountryProfile } from './src/data/countries/types';

// Keywords that indicate a cross-country leak
const KEYWORDS = {
  india: ["india", "mundra", "isprl", "kandla", "jamnagar", "mumbai"],
  singapore: ["singapore", "malacca", "jurong", "bukom", "ema", "sunda"],
};

/**
 * Prefixes used by ragService.ts for LLM-generated (live) chunks.
 * Static/knowledge-graph chunks use: preset_, hist_, sig_, corridor_, node_
 * Any chunk whose id does NOT start with rep_ is considered static fallback.
 */
const LLM_CHUNK_PREFIXES = ['rep_exec', 'rep_strategic', 'rep_impact', 'rep_rec', 'rep_ind'];

/**
 * Each required module maps to the rep_ prefix(es) it contributes.
 * Derived directly from ragService.ts chunk id assignments.
 */
const MODULE_CHUNK_MAP: Record<string, string[]> = {
  executive_summary:   ['rep_exec_summary'],
  strategic_context:   ['rep_strategic_implications'],
  supply_chain_impact: ['rep_impact_'],
  recommendations:     ['rep_rec_'],
  industries:          ['rep_ind_'],
};

function chunkIsLLMGenerated(id: string): boolean {
  return LLM_CHUNK_PREFIXES.some(prefix => id.startsWith(prefix));
}

async function testSingaporeIsolation() {
  const countryA = singaporeProfile;
  const countryB = indiaProfile; // the country whose keywords must NOT appear

  console.log(`\n=== Singapore isolation test (Singapore RAG must contain zero India keywords) ===\n`);
  console.log(`Querying RAG for ${countryA.name}...`);

  let results: any[];
  try {
    results = await queryRag(
      `What is the supply chain impact of a major geopolitical disruption?`,
      countryA,
    );
  } catch (err: any) {
    console.error(`❌ FATAL: RAG query threw an error: ${err.message}`);
    return;
  }

  // --- Module coverage (only LLM-generated chunks count) ---
  const llmChunks = results.filter((r: any) => chunkIsLLMGenerated(r.id ?? ''));
  const staticChunks = results.filter((r: any) => !chunkIsLLMGenerated(r.id ?? ''));

  console.log(`\n[Chunk breakdown]`);
  console.log(`  LLM-generated chunks : ${llmChunks.length} (${llmChunks.map((r: any) => r.id).join(', ')})`);
  console.log(`  Static/KG chunks     : ${staticChunks.length} (${staticChunks.map((r: any) => r.id).join(', ')})`);
  console.log(`  Total                : ${results.length}`);

  console.log(`\n[Module Coverage — LLM-generated only]`);
  let allModulesPresent = true;
  for (const [mod, prefixes] of Object.entries(MODULE_CHUNK_MAP)) {
    const present = llmChunks.some((r: any) =>
      prefixes.some(p => (r.id ?? '').startsWith(p))
    );
    console.log(`  ${mod}: ${present ? '✅ LLM-generated' : '❌ MISSING (static fallback or failed)'}`);
    if (!present) allModulesPresent = false;
  }

  if (!allModulesPresent) {
    console.error(`\n⚠️  One or more modules missing from LLM corpus — isolation result is on partial corpus.`);
  } else {
    console.log(`\n✅ All modules present from live LLM generation.`);
  }

  // --- Leak check ---
  console.log(`\n[Leak check — scanning all ${results.length} chunks for India keywords]`);
  let leaksFound = 0;
  for (const res of results) {
    const text = (res.text ?? '').toLowerCase();
    for (const keyword of KEYWORDS[countryB.id as keyof typeof KEYWORDS] ?? []) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) {
        console.error(`❌ LEAK: chunk '${res.id}' contains India keyword '${keyword}'`);
        leaksFound++;
      }
    }
  }

  if (leaksFound === 0) {
    console.log(`✅ Clean: Singapore's RAG contains no India keywords.`);
  } else {
    console.error(`❌ ${leaksFound} leak(s) found — isolation FAILED.`);
  }

  console.log(`\n=== Test complete ===`);
}

testSingaporeIsolation().catch(console.error).finally(() => process.exit(0));
