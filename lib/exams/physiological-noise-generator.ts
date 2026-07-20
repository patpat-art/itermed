import type { CaseExamOverride } from "@/lib/exam-values-meta";

const DEFAULT_NORMAL_SPREAD_PERCENT = 4;
const DEFAULT_ABNORMAL_SPREAD_PERCENT = 2;

/** PRNG deterministico per sessione (stesso seed → stesso rumore). */
function createSeededRandom(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  if (state === 0) state = 0x9e3779b9;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

/** Rumore gaussiano approssimato (Box-Muller) con seed deterministico. */
function gaussianNoise(seed: string, spreadPercent: number): number {
  const rand = createSeededRandom(seed);
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * (spreadPercent / 100);
}

function roundClinical(value: number): number {
  if (Math.abs(value) >= 100) return Math.round(value * 10) / 10;
  if (Math.abs(value) >= 10) return Math.round(value * 100) / 100;
  return Math.round(value * 1000) / 1000;
}

function parseNumericFromValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function formatNoisedValue(original: string | number, noised: number): string {
  if (typeof original === "number") return String(roundClinical(noised));

  const str = String(original);
  const match = str.replace(",", ".").match(/(-?\d+(?:\.\d+)?)/);
  if (!match) return str;

  const formatted = String(roundClinical(noised)).replace(".", match[0].includes(",") ? "," : ".");
  return str.replace(match[0], formatted);
}

/**
 * Applica micro-variazione fisiologica gaussiana al valore ideale.
 * Mantiene coerenza patologica: valori alterati oscillano entro ±2%, normali ±4%.
 */
export function applyPhysiologicalNoise(
  idealValue: number,
  options: {
    sessionSeed: string;
    examId: string;
    isAbnormal?: boolean;
    spreadPercent?: number;
  },
): number {
  const spread =
    options.spreadPercent ??
    (options.isAbnormal ? DEFAULT_ABNORMAL_SPREAD_PERCENT : DEFAULT_NORMAL_SPREAD_PERCENT);

  const noiseSeed = `${options.sessionSeed}:${options.examId}:noise`;
  const factor = 1 + gaussianNoise(noiseSeed, spread);
  const noised = idealValue * factor;

  if (options.isAbnormal && idealValue !== 0) {
    const sameSign = Math.sign(noised) === Math.sign(idealValue);
    if (!sameSign) return roundClinical(idealValue * (1 + Math.abs(gaussianNoise(noiseSeed + ":guard", spread / 2))));
  }

  return roundClinical(Math.max(0, noised));
}

/** Applica rumore fisiologico a override esami per sessione. */
export function applyNoiseToCaseExamOverrides(
  overrides: Record<string, CaseExamOverride>,
  sessionSeed: string,
): Record<string, CaseExamOverride> {
  if (!sessionSeed.trim()) return overrides;

  const out: Record<string, CaseExamOverride> = {};

  for (const [examId, override] of Object.entries(overrides)) {
    const numeric = parseNumericFromValue(override.value);
    if (numeric == null) {
      out[examId] = override;
      continue;
    }

    const noised = applyPhysiologicalNoise(numeric, {
      sessionSeed,
      examId,
      isAbnormal: override.isAbnormal,
    });

    out[examId] = {
      ...override,
      value: roundClinical(noised),
      normalFinding:
        override.normalFinding != null
          ? formatNoisedValue(override.normalFinding, noised)
          : `${noised}${override.isAbnormal ? " (patologico)" : ""}`,
    };
  }

  return out;
}

/** Applica rumore ai parametri vitali numerici del baseline. */
export function applyNoiseToVitalsBaseline(
  vitals: Record<string, unknown> | undefined,
  sessionSeed: string,
): Record<string, unknown> | undefined {
  if (!vitals || !sessionSeed.trim()) return vitals;

  const out: Record<string, unknown> = { ...vitals };
  const numericKeys = [
    "heartRate",
    "respiratoryRate",
    "spo2",
    "temperature",
    "systolicBP",
    "diastolicBP",
    "glycemia",
  ] as const;

  for (const key of numericKeys) {
    const raw = vitals[key];
    const numeric = parseNumericFromValue(raw);
    if (numeric == null) continue;
    out[key] = applyPhysiologicalNoise(numeric, {
      sessionSeed,
      examId: `vital-${key}`,
      isAbnormal: false,
      spreadPercent: 2,
    });
  }

  return out;
}

/** Applica rumore al payload esame prima della risposta API. */
export function finalizeExamNumericResult(
  payload: { finding: string; numericValue: number | null },
  sessionSeed: string | undefined,
  examId: string | undefined,
): { finding: string; numericValue: number | null } {
  if (payload.numericValue == null || !sessionSeed?.trim() || !examId?.trim()) {
    return payload;
  }

  const noised = applyPhysiologicalNoise(payload.numericValue, {
    sessionSeed,
    examId,
  });

  const finding = payload.finding.includes(String(payload.numericValue))
    ? payload.finding.replace(String(payload.numericValue), String(noised))
    : payload.finding;

  return { finding, numericValue: noised };
}
