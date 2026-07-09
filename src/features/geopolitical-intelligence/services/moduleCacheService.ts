/**
 * Per-module in-memory cache with independent TTLs.
 * Supports future granular refresh without regenerating the full report.
 */

import type { IntelligenceModuleName } from "../types/module-outputs";
import {
  MODULE_TTL_EVIDENCE_MS,
  MODULE_TTL_EXECUTIVE_MS,
  MODULE_TTL_RECOMMENDATIONS_MS,
  MODULE_TTL_SUPPLY_CHAIN_MS,
} from "../constants";

type CacheEntry<T> = {
  data: T;
  generatedAt: number;
  contextHash?: string;
};

type ModuleCacheStore = {
  executive_summary?: CacheEntry<unknown>;
  supply_chain_impact?: CacheEntry<unknown>;
  recommendations?: CacheEntry<unknown>;
  scenario_analysis?: CacheEntry<unknown>;
  evidence?: CacheEntry<unknown>;
};

type GlobalModuleState = typeof globalThis & {
  __intelligenceModuleCache?: ModuleCacheStore;
};

const globalStore = globalThis as GlobalModuleState;

function getStore(): ModuleCacheStore {
  if (!globalStore.__intelligenceModuleCache) {
    globalStore.__intelligenceModuleCache = {};
  }
  return globalStore.__intelligenceModuleCache;
}

const MODULE_TTLS: Record<IntelligenceModuleName, number> = {
  executive_summary: MODULE_TTL_EXECUTIVE_MS,
  supply_chain_impact: MODULE_TTL_SUPPLY_CHAIN_MS,
  recommendations: MODULE_TTL_RECOMMENDATIONS_MS,
  scenario_analysis: Infinity, // invalidated by context hash, not time
  evidence: MODULE_TTL_EVIDENCE_MS,
};

export function getModuleCache<T>(
  module: IntelligenceModuleName,
  contextHash?: string,
): T | null {
  const entry = getStore()[module] as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (module === "scenario_analysis") {
    if (contextHash && entry.contextHash !== contextHash) return null;
    return entry.data;
  }

  const ttl = MODULE_TTLS[module];
  if (Date.now() - entry.generatedAt > ttl) return null;
  return entry.data;
}

export function setModuleCache<T>(
  module: IntelligenceModuleName,
  data: T,
  contextHash?: string,
): void {
  getStore()[module] = {
    data,
    generatedAt: Date.now(),
    contextHash,
  };
}

export function clearAllModuleCaches(): void {
  globalStore.__intelligenceModuleCache = {};
}
