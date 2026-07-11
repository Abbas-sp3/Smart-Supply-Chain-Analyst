/**
 * geminiProvider.ts — Gemini API provider (fallback LLM)
 */

import type { LLMGenerateRequest, LLMProvider } from "./types";
import { GEMINI_API_BASE, GEMINI_MODEL, LLM_REQUEST_TIMEOUT_MS } from "./constants";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
};

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("[geminiProvider] GEMINI_API_KEY is not set.");
  }
  return apiKey;
}

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini" as const;

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async generate(request: LLMGenerateRequest): Promise<string> {
    const apiKey = getApiKey();
    const maxTokens = request.maxTokens ?? 4096;
    const temperature = request.temperature ?? 0.3;

    const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: request.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: request.userPrompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
          },
        }),
      });

      const data = (await res.json()) as GeminiResponse;

      if (!res.ok) {
        const message =
          data.error?.message ??
          `Gemini API request failed with status ${res.status}`;
        const err = new Error(`[geminiProvider] ${message}`) as Error & {
          status?: number;
        };
        err.status = res.status;
        throw err;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("[geminiProvider] Gemini returned an empty response.");
      }

      return text;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `[geminiProvider] Request timed out after ${LLM_REQUEST_TIMEOUT_MS}ms`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const geminiProvider = new GeminiProvider();
