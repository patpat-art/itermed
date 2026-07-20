type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

/** Last N user/assistant turns sent to the patient LLM — no generative summaries. */
export const PATIENT_CHAT_WINDOW_SIZE = 10;

/**
 * Returns the trailing dialogue window for the virtual patient model.
 * System messages are excluded; no summarization to avoid clinical hallucinations.
 */
export function applyPatientChatWindow(
  messages: ChatTurn[],
  windowSize = PATIENT_CHAT_WINDOW_SIZE,
): ChatTurn[] {
  const dialogue = messages.filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0,
  );
  if (dialogue.length <= windowSize) return dialogue;
  return dialogue.slice(-windowSize);
}
