/**
 * llmRouter.ts — Provider-agnostic LLM entry point
 *
 * Attempts Groq first. On retryable failures, automatically falls back to Gemini.
 * Callers receive raw string content — provider selection is fully internal.
 */

import { groqProvider, groqProvider2 } from "./groqProvider";
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

    // Define the preferred order of providers
    const providers = [
      { provider: groqProvider, label: "Groq (Key 1)" },
      { provider: groqProvider2, label: "Groq (Key 2)" },
      { provider: geminiProvider, label: "Gemini" }
    ];

    const configuredProviders = providers.filter(p => p.provider.isConfigured());

    if (configuredProviders.length === 0) {
      throw new Error(
        "[llmRouter] No LLM provider configured. Set GROQ_API_KEY, GROQ_API_KEY_2 or GEMINI_API_KEY.",
      );
    }

    for (let i = 0; i < configuredProviders.length; i++) {
      const { provider, label } = configuredProviders[i];
      const isLastProvider = i === configuredProviders.length - 1;

      try {
        if (i > 0 && fallbackReason) {
          console.warn(
            `[llmRouter] Retrying with ${label} due to previous failure: ${fallbackReason}`,
          );
        }

        const content = await provider.generate(request);
        const meta: LLMGenerateMetadata = {
          provider: provider.name,
          fallbackTriggered: i > 0,
          executionTimeMs: Date.now() - start,
          retryCount,
        };
        logResult(meta, fallbackReason);
        return { content, ...meta };

      } catch (err: unknown) {
        if (!isRetryableLLMError(err) || isLastProvider) {
          console.error(`[llmRouter] ${label} failed and cannot retry:`, err);
          throw err;
        }

        retryCount += 1;
        fallbackReason = getRetryReason(err);
      }
    }

    throw new Error("[llmRouter] All configured LLM providers failed.");
  }
}

export const llmRouter = new LLMRouter();
