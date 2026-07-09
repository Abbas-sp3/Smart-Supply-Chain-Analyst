/**
 * Shared utilities for independent intelligence modules.
 */

import type { z } from "zod";
import { callGroq } from "../services/groqService";
import { getModuleCache, setModuleCache } from "../services/moduleCacheService";
import type { IntelligenceModuleName } from "../types/module-outputs";
import { GROQ_MODEL, GROQ_MODULE_MAX_TOKENS } from "../constants";

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw.trim();
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
  const rawResponse = await callGroq(
    systemPrompt,
    userPrompt,
    GROQ_MODEL,
    GROQ_MODULE_MAX_TOKENS,
  );

  const jsonString = extractJson(rawResponse);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error(
      `[module:${moduleName}] Invalid JSON:`,
      jsonString.slice(0, 300),
    );
    throw new Error(
      `[module:${moduleName}] Groq returned invalid JSON: ${String(err)}`,
    );
  }

  const validated = schema.parse(parsed);
  setModuleCache(moduleName, validated, contextHash);
  return validated;
}
