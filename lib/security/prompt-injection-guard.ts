const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|system)\s+/gi,
  /you\s+are\s+now\s+(a|an)\s+/gi,
  /act\s+as\s+(if\s+you\s+are\s+)?(a\s+)?(system|admin|root|developer)/gi,
  /\[?\s*system\s*\]?\s*:/gi,
  /<\s*\/?\s*system\s*>/gi,
  /reveal\s+(your\s+)?(system\s+)?prompt/gi,
  /mostra\s+(il\s+)?(prompt|system\s+prompt)/gi,
  /ignora\s+(le\s+)?(istruzioni|regole)\s+(precedenti|di\s+sistema)/gi,
  /dimentica\s+(le\s+)?(istruzioni|regole)/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
];

const MAX_USER_INPUT_CHARS = 8_000;

/**
 * Neutralizes common prompt-injection phrases in user-authored text
 * before it is sent to OpenAI or vector retrieval APIs.
 */
export function stripPromptInjection(text: string): string {
  if (!text || typeof text !== "string") return text;

  let sanitized = text.slice(0, MAX_USER_INPUT_CHARS);
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  }
  return sanitized;
}

export function containsBlockedInjection(text: string): boolean {
  if (!text) return false;
  return INJECTION_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
