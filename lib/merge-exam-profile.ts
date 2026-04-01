import type { ExamClinicalMeta } from "./exam-default-values";

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
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}
