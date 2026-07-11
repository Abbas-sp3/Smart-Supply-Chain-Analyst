/**
 * responseNormalizer.ts — LLM Response Normalization Layer
 *
 * Pipeline: Raw LLM string → parse JSON → map aliases → fill defaults → Zod validation
 * Prevents dashboard crashes when the LLM omits or renames fields.
 */

import {
  ARRAY_ITEM_TEMPLATES,
  ENUM_COERCIONS,
  NORMALIZATION_PROFILES,
  PROPERTY_ALIASES,
  type NormalizationProfileId,
} from "./normalization-profiles";
import { tryParseLLMJson } from "./jsonRepair";

export type NormalizeResult = {
  parsed: unknown;
  normalized: unknown;
  repairedFields: string[];
};

export class LLMResponseParseError extends Error {
  readonly rawResponse: string;
  readonly context: string;

  constructor(message: string, rawResponse: string, context: string) {
    super(message);
    this.name = "LLMResponseParseError";
    this.rawResponse = rawResponse;
    this.context = context;
  }
}

const isDev = process.env.NODE_ENV === "development";

function devLog(message: string, data?: unknown): void {
  if (!isDev) return;
  if (data !== undefined) {
    console.log(`[responseNormalizer] ${message}`, data);
  } else {
    console.log(`[responseNormalizer] ${message}`);
  }
}

/** Strip markdown fences and extract the JSON object from raw LLM output */
export function extractJsonFromLLM(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw.trim();
}

function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

function resolveKey(key: string): string {
  return PROPERTY_ALIASES[key] ?? camelToSnake(key);
}

/** Recursively rename keys using alias map and camelCase → snake_case conversion */
function mapPropertyNames(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(mapPropertyNames);
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const mapped: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(record)) {
      mapped[resolveKey(key)] = mapPropertyNames(val);
    }

    return mapped;
  }

  return value;
}

function coerceEnum(fieldName: string, value: unknown): unknown {
  const rule = ENUM_COERCIONS[fieldName];
  if (!rule) return value;

  if (typeof value === "string" && rule.allowed.includes(value)) {
    return value;
  }

  return rule.fallback;
}

function getArrayItemTemplate(
  fieldName: string,
  defaultValue: unknown,
): Record<string, unknown> | null {
  if (ARRAY_ITEM_TEMPLATES[fieldName]) {
    return ARRAY_ITEM_TEMPLATES[fieldName];
  }

  if (Array.isArray(defaultValue) && defaultValue.length > 0) {
    const first = defaultValue[0];
    if (first !== null && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
  }

  return null;
}

function normalizeValue(
  value: unknown,
  template: unknown,
  path: string,
  repairedFields: string[],
  fieldName?: string,
): unknown {
  // Explicit null template (e.g. critical_cargo)
  if (template === null) {
    if (value === undefined) {
      repairedFields.push(path);
      return null;
    }
    return value;
  }

  // Arrays
  if (Array.isArray(template)) {
    const itemTemplate = getArrayItemTemplate(fieldName ?? path.split(".").pop() ?? "", template);
    const sourceArray = Array.isArray(value) ? value : [];

    if (!Array.isArray(value)) {
      repairedFields.push(path);
    }

    if (!itemTemplate) return sourceArray;

    return sourceArray.map((item, index) =>
      normalizeValue(item, itemTemplate, `${path}[${index}]`, repairedFields),
    );
  }

  // Objects
  if (template !== null && typeof template === "object") {
    const templateRecord = template as Record<string, unknown>;
    const sourceRecord =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

    if (value === undefined || value === null || Array.isArray(value)) {
      repairedFields.push(path);
    }

    const result: Record<string, unknown> = {};

    for (const [key, childTemplate] of Object.entries(templateRecord)) {
      const childPath = path ? `${path}.${key}` : key;
      const childValue = sourceRecord[key];

      if (childValue === undefined) {
        repairedFields.push(childPath);
        result[key] = normalizeValue(
          undefined,
          childTemplate,
          childPath,
          repairedFields,
          key,
        );
      } else {
        result[key] = normalizeValue(
          childValue,
          childTemplate,
          childPath,
          repairedFields,
          key,
        );
      }
    }

    return result;
  }

  // Primitives
  if (value === undefined || value === null) {
    if (fieldName && ENUM_COERCIONS[fieldName]) {
      repairedFields.push(path);
      return coerceEnum(fieldName, undefined);
    }
    if (value === undefined) {
      repairedFields.push(path);
    }
    return template;
  }

  if (fieldName && ENUM_COERCIONS[fieldName]) {
    const coerced = coerceEnum(fieldName, value);
    if (coerced !== value) repairedFields.push(path);
    return coerced;
  }

  return value;
}

/**
 * Normalize a parsed LLM object against a profile's default template.
 */
export function normalizeLLMObject(
  parsed: unknown,
  profileId: NormalizationProfileId,
  context: string = profileId,
): NormalizeResult {
  const profile = NORMALIZATION_PROFILES[profileId];
  if (!profile) {
    throw new Error(`[responseNormalizer] Unknown profile: ${profileId}`);
  }

  devLog(`Raw parsed object (${context}):`, parsed);

  const mapped = mapPropertyNames(parsed);
  const repairedFields: string[] = [];

  const normalized = normalizeValue(
    mapped,
    profile.defaults,
    "",
    repairedFields,
  );

  const uniqueRepaired = [...new Set(repairedFields)];

  if (uniqueRepaired.length > 0) {
    devLog(`Fields automatically repaired (${context}):`, uniqueRepaired);
  }

  devLog(`Normalized object (${context}):`, normalized);

  return {
    parsed,
    normalized,
    repairedFields: uniqueRepaired,
  };
}

/**
 * Full pipeline: extract JSON string → parse → normalize.
 * Throws LLMResponseParseError if JSON parsing fails.
 */
export function parseAndNormalizeLLMResponse(
  raw: string,
  profileId: NormalizationProfileId,
  context: string = profileId,
): NormalizeResult {
  devLog(`Raw LLM response (${context}):`, raw.slice(0, 500));

  const jsonString = extractJsonFromLLM(raw);

  const parsed = tryParseLLMJson(jsonString);
  if (parsed === null) {
    devLog(`JSON parse failed (${context}):`, jsonString.slice(0, 500));
    throw new LLMResponseParseError(
      `[responseNormalizer] Failed to parse LLM JSON for ${context}`,
      raw,
      context,
    );
  }

  return normalizeLLMObject(parsed, profileId, context);
}

/**
 * Returns normalized profile defaults when LLM output cannot be parsed.
 * Ensures the dashboard never crashes due to a single module failure.
 */
export function normalizeProfileDefaults(
  profileId: NormalizationProfileId,
  context: string,
): NormalizeResult {
  console.warn(
    `[responseNormalizer] Using empty defaults for ${context} after unparseable LLM output.`,
  );
  return normalizeLLMObject({}, profileId, context);
}

/**
 * Validate normalized data with Zod and log outcome in development.
 */
export function validateNormalizedResponse<T>(
  normalized: unknown,
  schema: { parse: (data: unknown) => T },
  context: string,
): T {
  try {
    const result = schema.parse(normalized);
    devLog(`Validation success (${context})`);
    return result;
  } catch (err) {
    devLog(`Validation failure (${context}):`, err);
    throw err;
  }
}
