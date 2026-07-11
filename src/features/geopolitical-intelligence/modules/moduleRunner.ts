/**
 * Shared utilities for independent intelligence modules.
 */

import type { z } from "zod";
import { callGroq } from "../services/groqService";
import { getModuleCache, setModuleCache } from "../services/moduleCacheService";
import type { IntelligenceModuleName } from "../types/module-outputs";
import { GROQ_MODEL, GROQ_MODULE_MAX_TOKENS, MODULE_MAX_TOKENS } from "../constants";
import {
  parseAndNormalizeLLMResponse,
  normalizeProfileDefaults,
  validateNormalizedResponse,
  LLMResponseParseError,
  type NormalizationProfileId,
} from "@/services/llm";

const MODULE_PROFILE_MAP: Record<IntelligenceModuleName, NormalizationProfileId> = {
  executive_summary: "executive_summary",
  supply_chain_impact: "supply_chain_impact",
  recommendations: "recommendations",
  scenario_analysis: "scenario_analysis",
  evidence: "evidence",
};

const COMPACT_JSON_SUFFIX =
  "\n\nIMPORTANT: Return COMPACT JSON only. Use brief sentences (max 15 words each). " +
  "Limit arrays to 3 items maximum. Never truncate — omit lower-priority items instead.";

async function fetchAndNormalizeModule<T>(
  moduleName: IntelligenceModuleName,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  profileId: NormalizationProfileId,
  attempt: number,
): Promise<T> {
  const maxTokens = MODULE_MAX_TOKENS[moduleName] ?? GROQ_MODULE_MAX_TOKENS;
  const prompt =
    attempt === 0 ? userPrompt : userPrompt + COMPACT_JSON_SUFFIX;

  const rawResponse = await callGroq(
    systemPrompt,
    prompt,
    GROQ_MODEL,
    maxTokens,
  );

  let normalized: unknown;
  let repairedFields: string[] = [];

  try {
    const result = parseAndNormalizeLLMResponse(
      rawResponse,
      profileId,
      `module:${moduleName}`,
    );
    normalized = result.normalized;
    repairedFields = result.repairedFields;
  } catch (err) {
    if (err instanceof LLMResponseParseError && attempt === 0) {
      console.warn(
        `[module:${moduleName}] JSON parse failed — retrying with compact output instruction.`,
      );
      return fetchAndNormalizeModule(
        moduleName,
        systemPrompt,
        userPrompt,
        schema,
        profileId,
        1,
      );
    }

    if (err instanceof LLMResponseParseError) {
      console.warn(
        `[module:${moduleName}] JSON still unparseable after retry — using empty module defaults.`,
      );
      const fallback = normalizeProfileDefaults(
        profileId,
        `module:${moduleName}`,
      );
      normalized = fallback.normalized;
      repairedFields = fallback.repairedFields;
    } else {
      throw err;
    }
  }

  if (repairedFields.length > 0) {
    console.log(
      `[module:${moduleName}] Repaired ${repairedFields.length} missing field(s).`,
    );
  }

  try {
    return validateNormalizedResponse(
      normalized,
      schema,
      `module:${moduleName}`,
    );
  } catch (validationErr) {
    console.warn(
      `[module:${moduleName}] Validation failed after normalization — using empty module defaults.`,
      validationErr,
    );
    const fallback = normalizeProfileDefaults(profileId, `module:${moduleName}`);
    return validateNormalizedResponse(
      fallback.normalized,
      schema,
      `module:${moduleName}:fallback`,
    );
  }
}

export async function runIntelligenceModule<T>(
  moduleName: IntelligenceModuleName,
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  contextHash?: string,
): Promise<T> {
  const cached = getModuleCache<T>(moduleName, contextHash);
  if (cached) {
    console.log(`[module:${moduleName}] Returning cached output.`);
    return cached;
  }

  console.log(`[module:${moduleName}] Generating fresh output...`);

  const profileId = MODULE_PROFILE_MAP[moduleName];
  const validated = await fetchAndNormalizeModule(
    moduleName,
    systemPrompt,
    userPrompt,
    schema,
    profileId,
    0,
  );

  setModuleCache(moduleName, validated, contextHash);
  return validated;
}
