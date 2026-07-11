/**
 * groqProvider.ts — Groq API provider (primary LLM)
 */

import Groq from "groq-sdk";
import { GROQ_MODEL, GROQ_MAX_TOKENS } from "@/features/geopolitical-intelligence/constants";
import type { LLMGenerateRequest, LLMProvider } from "./types";
import { LLM_REQUEST_TIMEOUT_MS } from "./constants";

function createClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("[groqProvider] GROQ_API_KEY is not set.");
  }
  return new Groq({ apiKey });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[groqProvider] ${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export class GroqProvider implements LLMProvider {
  readonly name = "groq" as const;

  isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }

  async generate(request: LLMGenerateRequest): Promise<string> {
    const client = createClient();
    const model = request.model ?? GROQ_MODEL;
    const maxTokens = request.maxTokens ?? GROQ_MAX_TOKENS;
    const temperature = request.temperature ?? 0.3;

    try {
      const completion = await withTimeout(
        client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
        }),
        LLM_REQUEST_TIMEOUT_MS,
        model,
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("[groqProvider] Groq returned an empty response.");
      }

      return content;
    } catch (err: unknown) {
      // Normalize Groq SDK errors so llmRouter can detect retryable status codes
      if (typeof err === "object" && err !== null && "status" in err) {
        const status = (err as { status: unknown }).status;
        if (typeof status === "number") {
          const wrapped = new Error(
            `[groqProvider] ${err instanceof Error ? err.message : String(err)}`,
          ) as Error & { status: number };
          wrapped.status = status;
          throw wrapped;
        }
      }
      throw err;
    }
  }
}

export const groqProvider = new GroqProvider();
