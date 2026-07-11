/**
 * Shared LLM layer types — provider-agnostic request/response contract.
 */

export type LLMProviderName = "groq" | "gemini";

export type LLMGenerateRequest = {
  systemPrompt: string;
  userPrompt: string;
  /** Groq model override — ignored by Gemini (uses GEMINI_MODEL constant) */
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type LLMGenerateMetadata = {
  provider: LLMProviderName;
  fallbackTriggered: boolean;
  executionTimeMs: number;
  retryCount: number;
};

export type LLMGenerateResult = LLMGenerateMetadata & {
  content: string;
};

export interface LLMProvider {
  readonly name: LLMProviderName;
  isConfigured(): boolean;
  generate(request: LLMGenerateRequest): Promise<string>;
}
