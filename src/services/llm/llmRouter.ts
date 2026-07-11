/**
 * llmRouter.ts — Provider-agnostic LLM entry point
 *
 * Attempts Groq first. On retryable failures, automatically falls back to Gemini.
 * Callers receive raw string content — provider selection is fully internal.
 */

import { groqProvider } from "./groqProvider";
import { geminiProvider } from "./geminiProvider";
import { getRetryReason, isRetryableLLMError } from "./errors";
import type { LLMGenerateMetadata, LLMGenerateRequest, LLMGenerateResult } from "./types";

function logResult(meta: LLMGenerateMetadata, reason?: string): void {
  const reasonSuffix = reason ? ` reason=${reason}` : "";
  console.log(
    `[llmRouter] provider=${meta.provider} fallback=${meta.fallbackTriggered} ` +
      `executionTimeMs=${meta.executionTimeMs} retryCount=${meta.retryCount}${reasonSuffix}`,
  );
}

export class LLMRouter {
  /**
   * Generate a completion using Groq, falling back to Gemini on retryable errors.
   * Returns only the content string for backward compatibility with callGroq().
   */
  async generate(request: LLMGenerateRequest): Promise<string> {
    const result = await this.generateWithMetadata(request);
    return result.content;
  }

  /** Full result including provider metadata (for diagnostics / testing) */
  async generateWithMetadata(
    request: LLMGenerateRequest,
  ): Promise<LLMGenerateResult> {
    const start = Date.now();
    let retryCount = 0;
    let fallbackReason: string | undefined;

    // --- Attempt 1: Groq (primary) ---
    if (groqProvider.isConfigured()) {
      try {
        const content = await groqProvider.generate(request);
        const meta: LLMGenerateMetadata = {
          provider: "groq",
          fallbackTriggered: false,
          executionTimeMs: Date.now() - start,
          retryCount,
        };
        logResult(meta);
        return { content, ...meta };
      } catch (err: unknown) {
        if (!isRetryableLLMError(err)) {
          console.error("[llmRouter] Groq failed with non-retryable error:", err);
          throw err;
        }

        retryCount += 1;
        fallbackReason = getRetryReason(err);
        console.warn(
          `[llmRouter] Groq retryable failure (${fallbackReason}) — attempting Gemini fallback.`,
        );

        if (!geminiProvider.isConfigured()) {
          console.error(
            "[llmRouter] Gemini fallback unavailable — GEMINI_API_KEY not set.",
          );
          throw err;
        }
      }
    } else if (geminiProvider.isConfigured()) {
      console.log("[llmRouter] GROQ_API_KEY not set — using Gemini directly.");
    } else {
      throw new Error(
        "[llmRouter] No LLM provider configured. Set GROQ_API_KEY or GEMINI_API_KEY.",
      );
    }

    // --- Attempt 2: Gemini (fallback or primary when Groq key missing) ---
    const content = await geminiProvider.generate(request);
    const meta: LLMGenerateMetadata = {
      provider: "gemini",
      fallbackTriggered: groqProvider.isConfigured(),
      executionTimeMs: Date.now() - start,
      retryCount,
    };
    logResult(meta, fallbackReason);
    return { content, ...meta };
  }
}

export const llmRouter = new LLMRouter();
