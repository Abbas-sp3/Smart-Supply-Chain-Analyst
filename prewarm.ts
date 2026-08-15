/**
 * prewarm.ts — Intelligence Report Pre-warmer
 *
 * Generates and caches an intelligence report for every country in COUNTRY_REGISTRY
 * sequentially (not parallel), with a configurable delay between countries to avoid
 * hitting Groq/Gemini rate limits.
 *
 * Usage:
 *   npx tsx prewarm.ts
 *
 * After this runs successfully, any call to generateIntelligenceReport(country) within
 * the TTL window will be served from cache with zero LLM calls.
 *
 * Cache TTL is controlled by INTELLIGENCE_CACHE_TTL_MS in .env.local.
 * Set it to e.g. 14400000 (4 hours) on demo day so the warm cache persists.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { COUNTRY_REGISTRY } from './src/data/countries/index';
import { generateIntelligenceReport } from './src/features/geopolitical-intelligence/services/intelligenceService';
import { INTELLIGENCE_CACHE_TTL_MS } from './src/features/geopolitical-intelligence/constants';

const DELAY_BETWEEN_COUNTRIES_MS = Number(process.env.PREWARM_DELAY_MS) || 30_000; // 30s default

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const countries = Object.values(COUNTRY_REGISTRY);
  const ttlMinutes = Math.round(INTELLIGENCE_CACHE_TTL_MS / 60_000);
  const expiresAt = new Date(Date.now() + INTELLIGENCE_CACHE_TTL_MS).toLocaleTimeString();

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║          Intelligence Report Pre-warmer                 ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`Countries to warm : ${countries.map(c => c.name).join(', ')}`);
  console.log(`Cache TTL         : ${ttlMinutes} minutes (expires ~${expiresAt})`);
  console.log(`Delay between     : ${DELAY_BETWEEN_COUNTRIES_MS / 1000}s`);
  console.log(`──────────────────────────────────────────────────────────\n`);

  const results: { country: string; status: 'ok' | 'failed'; durationMs: number; error?: string }[] = [];

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    console.log(`\n[${i + 1}/${countries.length}] Warming: ${country.name} (${country.id})`);
    const t0 = Date.now();

    try {
      await generateIntelligenceReport(country);
      const durationMs = Date.now() - t0;
      console.log(`✅ ${country.name} warmed in ${(durationMs / 1000).toFixed(1)}s — cached for ${ttlMinutes} min.`);
      results.push({ country: country.name, status: 'ok', durationMs });
    } catch (err: any) {
      const durationMs = Date.now() - t0;
      console.error(`❌ ${country.name} failed: ${err.message}`);
      results.push({ country: country.name, status: 'failed', durationMs, error: err.message });
    }

    // Delay between countries (skip delay after last one)
    if (i < countries.length - 1) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_COUNTRIES_MS / 1000}s before next country (rate-limit cooldown)...`);
      await sleep(DELAY_BETWEEN_COUNTRIES_MS);
    }
  }

  // Summary
  console.log(`\n──────────────────────────────────────────────────────────`);
  console.log(`Pre-warm summary:`);
  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : '❌';
    const detail = r.status === 'ok'
      ? `${(r.durationMs / 1000).toFixed(1)}s`
      : `FAILED — ${r.error}`;
    console.log(`  ${icon} ${r.country}: ${detail}`);
  }

  const allOk = results.every(r => r.status === 'ok');
  if (allOk) {
    console.log(`\n✅ All ${results.length} countries warmed successfully. Cache expires ~${expiresAt}.`);
    console.log(`   Demo requests will be served from cache with zero LLM calls until then.`);
  } else {
    console.error(`\n⚠️  ${results.filter(r => r.status === 'failed').length} country(ies) failed to warm. Check errors above.`);
  }

  console.log(`──────────────────────────────────────────────────────────\n`);
}

main().catch(console.error).finally(() => process.exit(0));
