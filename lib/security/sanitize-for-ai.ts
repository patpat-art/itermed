import { sanitizeUserPrompt } from "@/lib/security/pii-sanitizer";
import { containsBlockedInjection, stripPromptInjection } from "@/lib/security/prompt-injection-guard";

type ChatLikeMessage = { role: string; content: string };

/**
 * Full pipeline: PII redaction + prompt-injection neutralization for external AI/RAG.
 */
export function sanitizeForExternalAI(text: string): string {
  return stripPromptInjection(sanitizeUserPrompt(text));
}

export function sanitizeOptionalForExternalAI(text: string | undefined | null): string | undefined {
  if (text == null) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return sanitizeForExternalAI(trimmed);
}

/** Sanitizes user chat turns; drops messages with hard-blocked injection patterns. */
export function sanitizeUserMessagesForAI<T extends ChatLikeMessage>(messages: T[]): T[] {
  return messages
    .map((message) =>
      message.role === "user"
        ? { ...message, content: sanitizeForExternalAI(message.content) }
        : message,
    )
    .filter((message) => {
      if (message.role !== "user") return true;
      return !containsBlockedInjection(message.content);
    });
}
