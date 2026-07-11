/**
 * Determines whether a provider failure should trigger Gemini fallback.
 */

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const RETRYABLE_MESSAGE_PATTERNS = [
  /rate\s*limit/i,
  /rate_limit/i,
  /token\s*limit/i,
  /tokens per (minute|day|hour)/i,
  /quota/i,
  /timeout/i,
  /timed?\s*out/i,
  /service unavailable/i,
  /overloaded/i,
  /temporarily unavailable/i,
  /network/i,
  /econnreset/i,
  /econnrefused/i,
  /enotfound/i,
  /fetch failed/i,
  /socket hang up/i,
];

function extractStatusCode(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;

  const record = err as Record<string, unknown>;
  if (typeof record.status === "number") return record.status;
  if (typeof record.statusCode === "number") return record.statusCode;

  const response = record.response;
  if (typeof response === "object" && response !== null) {
    const status = (response as Record<string, unknown>).status;
    if (typeof status === "number") return status;
  }

  return undefined;
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function isRetryableLLMError(err: unknown): boolean {
  const status = extractStatusCode(err);
  if (status !== undefined && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  const message = extractMessage(err);
  return RETRYABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

export function getRetryReason(err: unknown): string {
  const status = extractStatusCode(err);
  if (status === 429) return "rate_limit";
  if (status === 408 || /timeout/i.test(extractMessage(err))) return "timeout";
  if (status === 503 || status === 502) return "service_unavailable";
  if (/network|econn|fetch failed/i.test(extractMessage(err))) return "network_failure";
  if (/token|quota|rate/i.test(extractMessage(err))) return "token_limit";
  return "provider_error";
}
