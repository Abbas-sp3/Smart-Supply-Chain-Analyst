/**
 * groqService.ts — Groq API Communication Layer
 *
 * Single responsibility: communicate with the Groq API.
 * NO other file in this project should import groq-sdk or call Groq directly.
 * All AI calls are routed through this service.
 */

import Groq from "groq-sdk";
import { GROQ_MODEL, GROQ_MAX_TOKENS } from "../constants";

// ---------------------------------------------------------------------------
// Client factory — reads the key fresh on every call so hot-reloaded env
// vars (e.g. after adding GROQ_API_KEY while the dev server is running)
// are always picked up without needing a server restart.
// ---------------------------------------------------------------------------
function createGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[groqService] GROQ_API_KEY is not set. Add it to .env.local and restart the dev server.",
    );
  }
  return new Groq({ apiKey });
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/**
 * Sends a system + user prompt to Groq and returns the raw string response.
 *
 * @param systemPrompt - The analyst persona and output contract
 * @param userPrompt   - The formatted source data asking for analysis
 * @returns Raw string content from the model (expected to be JSON)
 * @throws  If GROQ_API_KEY is missing or the API call fails
 */
export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  modelOverride?: string,
  maxTokensOverride?: number
): Promise<string> {
  const client = createGroqClient();

  const targetModel = modelOverride || GROQ_MODEL;
  const targetTokens = maxTokensOverride || GROQ_MAX_TOKENS;

  console.log(`[groqService] Calling ${targetModel}...`);

  const completion = await client.chat.completions.create({
    model: targetModel,
    max_tokens: targetTokens,
    temperature: 0.3, // Low temperature for factual, consistent intelligence output
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("[groqService] Groq returned an empty response.");
  }

  console.log(
    `[groqService] Response received. Tokens used: ${completion.usage?.total_tokens ?? "unknown"}`,
  );

  return content;
}
