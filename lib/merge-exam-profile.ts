import type { ExamClinicalMeta } from "./exam-default-values";

function stripMarkdownCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}

/**
 * Priorità normalFinding: valore autore (alterato) → LLM → dizionario default.
 */
export function mergeExamProfile(
  dictionary: Record<string, ExamClinicalMeta>,
  abnormalByExamId: Record<string, string>,
  llmByExamId: Record<string, string>,
): Record<string, ExamClinicalMeta> {
  const out: Record<string, ExamClinicalMeta> = {};
  for (const [examId, def] of Object.entries(dictionary)) {
    const author = abnormalByExamId[examId]?.trim();
    const llm = llmByExamId[examId]?.trim();
    out[examId] = {
      ...def,
      normalFinding: author || llm || def.normalFinding,
    };
  }
  return out;
}

export function parseLlmExamJson(raw: string): Record<string, string> {
  const parsed = JSON.parse(stripMarkdownCodeFence(raw)) as unknown;
  return toStringRecord(parsed);
}
