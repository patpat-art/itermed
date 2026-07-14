const REDACTED = "[REDACTED]";

/** Italian Codice Fiscale (16 chars). */
const CODICE_FISCALE_REGEX =
  /\b[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]\b/gi;

/** Email addresses (IT/EN). */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Phone numbers: Italian landline/mobile and common international formats.
 * Requires at least 8 digits to reduce false positives on short numeric tokens.
 */
const PHONE_REGEX =
  /(?<!\w)(?:\+?(?:39|1|44|33|49)[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,6})?(?!\w)/g;

/** Common date-of-birth formats (DD/MM/YYYY and variants). */
const DATE_OF_BIRTH_REGEX =
  /\b(?:0?[1-9]|[12]\d|3[01])[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:19|20)\d{2}\b/g;

const DOB_PHRASE_IT_REGEX =
  /\b(?:nato(?:\s+il)?|nata\s+il|data\s+di\s+nascita)\s*:?\s*(?:0?[1-9]|[12]\d|3[01])[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:19|20)\d{2}\b/gi;

const DOB_PHRASE_EN_REGEX =
  /\b(?:born\s+on|date\s+of\s+birth|dob)\s*:?\s*(?:0?[1-9]|[12]\d|3[01])[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:19|20)\d{2}\b/gi;

/** Self-introduction patterns that often expose given names. */
const NAME_INTRO_IT_REGEX =
  /\b(?:mi\s+chiamo|sono|il\s+mio\s+nome\s+(?:è|e'))\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)/gi;

const NAME_INTRO_EN_REGEX =
  /\b(?:my\s+name\s+is|i\s+am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;

function redactPhoneMatches(text: string): string {
  return text.replace(PHONE_REGEX, (match) => {
    const digits = match.replace(/\D/g, "");
    return digits.length >= 8 ? REDACTED : match;
  });
}

function redactNameIntros(text: string): string {
  return text
    .replace(NAME_INTRO_IT_REGEX, (full) => full.replace(/\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)$/i, ` ${REDACTED}`))
    .replace(NAME_INTRO_EN_REGEX, (full) => full.replace(/\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/i, ` ${REDACTED}`));
}

/**
 * Scrubs common PII from free-text user prompts before external AI / vector APIs.
 */
export function sanitizeUserPrompt(text: string): string {
  if (!text || typeof text !== "string") return text;

  let sanitized = text;
  sanitized = sanitized.replace(CODICE_FISCALE_REGEX, REDACTED);
  sanitized = sanitized.replace(EMAIL_REGEX, REDACTED);
  sanitized = redactPhoneMatches(sanitized);
  sanitized = sanitized.replace(DOB_PHRASE_IT_REGEX, (match) => match.replace(DATE_OF_BIRTH_REGEX, REDACTED));
  sanitized = sanitized.replace(DOB_PHRASE_EN_REGEX, (match) => match.replace(DATE_OF_BIRTH_REGEX, REDACTED));
  sanitized = sanitized.replace(DATE_OF_BIRTH_REGEX, REDACTED);
  sanitized = redactNameIntros(sanitized);

  return sanitized;
}

export function sanitizeOptionalUserPrompt(text: string | undefined | null): string | undefined {
  if (text == null) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return sanitizeUserPrompt(trimmed);
}

type ChatLikeMessage = { role: string; content: string };

/** Sanitizes user-authored chat turns while preserving assistant/system content. */
export function sanitizeUserChatMessages<T extends ChatLikeMessage>(messages: T[]): T[] {
  return messages.map((message) =>
    message.role === "user"
      ? { ...message, content: sanitizeUserPrompt(message.content) }
      : message,
  );
}
