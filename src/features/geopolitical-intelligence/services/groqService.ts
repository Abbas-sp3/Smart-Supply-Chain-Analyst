/**
 * groqService.ts — Backward-compatible LLM entry point
 *
 * All AI calls route through llmRouter (Groq primary → Gemini fallback).
 * Existing callers import callGroq() unchanged — provider selection is internal.
 */

import { llmRouter } from "@/services/llm";

/**
 * Sends a system + user prompt and returns the raw string response.
 * Internally uses Groq first, with automatic Gemini fallback on retryable errors.
 *
 * @param systemPrompt - The analyst persona and output contract
 * @param userPrompt   - The formatted source data asking for analysis
 * @returns Raw string content from the model (expected to be JSON)
 * @throws  If both Groq and Gemini fail, or error is non-retryable
 */
export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  modelOverride?: string,
  maxTokensOverride?: number,
): Promise<string> {
  return llmRouter.generate({
    systemPrompt,
    userPrompt,
    model: modelOverride,
    maxTokens: maxTokensOverride,
  });
}
