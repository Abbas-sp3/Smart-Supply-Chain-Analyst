/**
 * Attempts to repair truncated or malformed JSON from LLM output.
 * Common when max_tokens cuts the response mid-object.
 */

/** Remove trailing incomplete property/value fragments */
function stripTrailingFragment(json: string): string {
  let s = json.trim();

  // Trailing comma before we close brackets
  s = s.replace(/,\s*$/, "");

  // Incomplete string value:  "key": "partial text...
  s = s.replace(/,\s*"[^"]*"\s*:\s*"[^"\\]*(?:\\.[^"\\]*)*$/m, "");
  // Incomplete key:  "partial...
  s = s.replace(/,\s*"[^"]*$/m, "");
  // Lone opening property without value
  s = s.replace(/,\s*"[^"]*"\s*:\s*$/m, "");

  return s;
}

/** Count unclosed brackets/braces, ignoring content inside strings */
function countUnclosed(json: string): { braces: number; brackets: number; inString: boolean } {
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{") braces++;
      else if (ch === "}") braces--;
      else if (ch === "[") brackets++;
      else if (ch === "]") brackets--;
    }
  }

  return { braces, brackets, inString };
}

/**
 * Close unclosed strings, arrays, and objects so JSON.parse may succeed.
 */
export function repairTruncatedJson(json: string): string {
  let s = stripTrailingFragment(json);
  const { braces, brackets, inString } = countUnclosed(s);

  if (inString) {
    s += '"';
  }

  let openBrackets = brackets;
  let openBraces = braces;

  while (openBrackets > 0) {
    s += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    s += "}";
    openBraces--;
  }

  return s;
}

/**
 * Try parsing JSON, applying repair strategies on failure.
 * Returns null if all strategies fail.
 */
export function tryParseLLMJson(raw: string): unknown | null {
  const candidates = [
    raw,
    repairTruncatedJson(raw),
  ];

  // Deduplicate identical candidates
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);

    try {
      return JSON.parse(trimmed);
    } catch {
      // try next strategy
    }
  }

  return null;
}
