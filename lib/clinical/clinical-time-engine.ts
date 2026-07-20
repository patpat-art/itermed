import type { CaseDifficulty } from "@prisma/client";
import {
  computeElapsedMinutesFromExams,
  normalizeStepId,
  type ExamLatenciesMap,
} from "@/lib/cases/simulation-time";
import type { SessionMilestoneSnapshot } from "@/lib/simulator/milestone-tracker";

/** Ritardi simulati per azioni pesanti (minuti di gestione clinica). */
export const HEAVY_EXAM_TIME_MINUTES = {
  tomography: 30,
  complexLaboratory: 15,
  defaultFallback: 5,
} as const;

const TC_EXAM_PATTERN =
  /\b(tc|tac|tomograf|angio[\s-]?ct|pet[\s/-]?ct|rm[\s/-]?encefal|rm[\s/-]?cerebr)\b/i;
const COMPLEX_LAB_PATTERN =
  /\b(emocromo|troponin|emogas|coagul|elettrolit|enzimi|lattat|pcr|ddimero|procalcitonin|nt-probnp|amilasi|lipasi|creatinin|glicemi)\b/i;

const TIME_DEPENDENT_PATHOLOGY_PATTERN =
  /\b(stemi|nstemi|infarto|ictus|stroke|embolia|trombol|fibrinol|sepsi|shock|anafilassi|emorragia|politrauma|arresto)\b/i;

const BASIC_WORKUP_MILESTONES = ["anamnesi_completa", "esame_obiettivo"] as const;

export type ClinicalTimeVerdict =
  | "OPTIMAL"
  | "TOO_FAST_IMPULSIVE"
  | "TOO_SLOW_INERTIA"
  | "WITHIN_RANGE";

export type ClinicalTimeAnalysis = {
  interactionSeconds: number;
  simulatedClinicalMinutes: number;
  recommendedMinutes: number;
  verdict: ClinicalTimeVerdict;
  deltaMinutes: number;
  formalWarning: string;
  legalRiskNote: string;
  skippedBasicWorkup: boolean;
  timeDependentPathology: boolean;
  guidelineReferences: string[];
};

function hasMilestone(keys: Set<string>, key: string): boolean {
  if (keys.has(key)) return true;
  return [...keys].some((k) => k.includes(key) || key.includes(k));
}

/** Classifica un esame come TC/TAC, laboratorio complesso o standard. */
export function classifyExamTimeCategory(examId: string, examName?: string): "tomography" | "complexLaboratory" | "standard" {
  const combined = `${normalizeStepId(examId)} ${examName ?? ""}`;
  if (TC_EXAM_PATTERN.test(combined)) return "tomography";
  if (COMPLEX_LAB_PATTERN.test(combined)) return "complexLaboratory";
  return "standard";
}

/**
 * Costo temporale clinico di un singolo esame.
 * Priorità: latenza caso → categoria pesante → catalogo → fallback.
 */
export function resolveExamClinicalMinutes(params: {
  examId: string;
  examName?: string;
  caseLatencies?: ExamLatenciesMap;
  catalogMinutes?: number;
}): number {
  const key = normalizeStepId(params.examId);
  const caseLatencies = params.caseLatencies ?? {};

  const direct = caseLatencies[key];
  if (direct != null) return direct;

  const fuzzy = Object.entries(caseLatencies).find(
    ([k]) => key.includes(k) || k.includes(key),
  );
  if (fuzzy?.[1] != null) return fuzzy[1];

  const category = classifyExamTimeCategory(params.examId, params.examName);
  if (category === "tomography") return HEAVY_EXAM_TIME_MINUTES.tomography;
  if (category === "complexLaboratory") return HEAVY_EXAM_TIME_MINUTES.complexLaboratory;

  if (params.catalogMinutes != null && params.catalogMinutes > 0) {
    return params.catalogMinutes;
  }

  return HEAVY_EXAM_TIME_MINUTES.defaultFallback;
}

/** Somma i minuti clinici simulati per tutti gli esami richiesti. */
export function computeSimulatedClinicalMinutes(params: {
  requestedExamIds: string[];
  examNameById?: Record<string, string>;
  caseLatencies?: ExamLatenciesMap;
  catalogMinutesById?: Record<string, number>;
}): number {
  const seen = new Set<string>();
  let total = 0;

  for (const examId of params.requestedExamIds) {
    const key = normalizeStepId(examId);
    if (seen.has(key)) continue;
    seen.add(key);

    total += resolveExamClinicalMinutes({
      examId,
      examName: params.examNameById?.[examId],
      caseLatencies: params.caseLatencies,
      catalogMinutes: params.catalogMinutesById?.[examId],
    });
  }

  return total;
}

/** Tempo medio consigliato per il caso (benchmark didattico). */
export function computeRecommendedCaseMinutes(params: {
  estimatedDurationMinutes?: number | null;
  timeLimitMinutes?: number | null;
  goldStandardPath?: string[];
  difficulty?: CaseDifficulty;
  patientDeteriorationThreshold?: number | null;
}): number {
  if (params.estimatedDurationMinutes != null && params.estimatedDurationMinutes > 0) {
    return params.estimatedDurationMinutes;
  }
  if (params.timeLimitMinutes != null && params.timeLimitMinutes > 0) {
    return Math.round(params.timeLimitMinutes * 0.75);
  }
  if (params.patientDeteriorationThreshold != null && params.patientDeteriorationThreshold > 0) {
    return Math.round(params.patientDeteriorationThreshold * 0.85);
  }

  const goldSteps = params.goldStandardPath?.length ?? 0;
  const base = goldSteps > 0 ? goldSteps * 8 + 18 : 35;

  switch (params.difficulty) {
    case "EASY":
      return Math.max(20, base - 8);
    case "HARD":
      return base + 12;
    default:
      return base;
  }
}

function detectTimeDependentPathology(caseContext?: string, specialty?: string): boolean {
  const combined = `${caseContext ?? ""} ${specialty ?? ""}`;
  return TIME_DEPENDENT_PATHOLOGY_PATTERN.test(combined);
}

function hasSkippedBasicWorkup(milestones: SessionMilestoneSnapshot[]): boolean {
  const keys = new Set(milestones.map((m) => m.milestoneKey));
  const met = BASIC_WORKUP_MILESTONES.filter((k) => hasMilestone(keys, k)).length;
  return met < BASIC_WORKUP_MILESTONES.length;
}

function buildGuidelineReferences(
  timeDependent: boolean,
  verdict: ClinicalTimeVerdict,
  specialty?: string,
): string[] {
  const refs: string[] = ["Legge Gelli-Bianco n. 24/2017 — art. 5 SNLG"];
  if (timeDependent && verdict === "TOO_SLOW_INERTIA") {
    refs.push("Linee Guida ESC STEMI — door-to-balloon / door-to-needle");
    refs.push("Linee Guida ESO Stroke — time is brain (IV thrombolysis window)");
    refs.push("Rapporti ISTISAN — appropriatezza tempi di presa in carico PS");
    if (/cardio|coronar|stemi|infarto/i.test(specialty ?? "")) {
      refs.push("Raccomandazioni SICI-GISE — tempi di riperfusione miocardica");
    }
  }
  if (verdict === "TOO_FAST_IMPULSIVE") {
    refs.push("Linee Guida SNLG — appropriatezza prescrittiva e sicurezza del paziente");
  }
  return refs;
}

/**
 * Analisi deterministica del tempo clinico per il report medico-legale.
 * Valuta imprudenza (troppo veloce) e inerzia (troppo lento) rispetto al benchmark del caso.
 */
export function analyzeClinicalTimePerformance(params: {
  interactionSeconds: number;
  simulatedClinicalMinutes: number;
  recommendedMinutes: number;
  milestones?: SessionMilestoneSnapshot[];
  requestedExamIds?: string[];
  caseContext?: string;
  specialty?: string;
  patientDeteriorationThreshold?: number | null;
}): ClinicalTimeAnalysis {
  const {
    interactionSeconds,
    simulatedClinicalMinutes,
    recommendedMinutes,
    milestones = [],
    caseContext,
    specialty,
    patientDeteriorationThreshold,
  } = params;

  const timeDependent = detectTimeDependentPathology(caseContext, specialty);
  const skippedBasic = hasSkippedBasicWorkup(milestones);
  const deltaMinutes = simulatedClinicalMinutes - recommendedMinutes;

  const fastThreshold = recommendedMinutes * 0.55;
  const slowThreshold = Math.max(
    patientDeteriorationThreshold ?? 0,
    recommendedMinutes * (timeDependent ? 1.25 : 1.45),
  );

  let verdict: ClinicalTimeVerdict = "WITHIN_RANGE";

  if (simulatedClinicalMinutes < fastThreshold && skippedBasic) {
    verdict = "TOO_FAST_IMPULSIVE";
  } else if (
    simulatedClinicalMinutes > slowThreshold ||
    (timeDependent &&
      patientDeteriorationThreshold != null &&
      simulatedClinicalMinutes > patientDeteriorationThreshold)
  ) {
    verdict = "TOO_SLOW_INERTIA";
  } else if (Math.abs(deltaMinutes) <= recommendedMinutes * 0.15) {
    verdict = "OPTIMAL";
  }

  const guidelineReferences = buildGuidelineReferences(timeDependent, verdict, specialty);

  let formalWarning = "";
  let legalRiskNote = "";

  if (verdict === "TOO_FAST_IMPULSIVE") {
    formalWarning =
      `WARNING FORMALE — IMPRUDENZA CLINICA: tempo di gestione simulato (${simulatedClinicalMinutes} min) ` +
      `significativamente inferiore al benchmark consigliato (${recommendedMinutes} min) con omissione di ` +
      `anamnesi completa e/o esame obiettivo strutturato. Rischio di diagnosi affrettata e sottovalutazione di red flag.`;
    legalRiskNote =
      "Sotto il profilo medico-legale (art. 5 L. 24/2017), la condotta impulsiva integra potenziale imprudenza " +
      "se il percorso diagnostico non consente di escludere patologie tempo-dipendenti. Il nesso causale va valutato " +
      "in relazione al danno evitabile con un workup adeguato.";
  } else if (verdict === "TOO_SLOW_INERTIA") {
    const delay = Math.max(0, simulatedClinicalMinutes - recommendedMinutes);
    formalWarning =
      `WARNING FORMALE — INERZIA CLINICA: ritardo di ${delay} min oltre la finestra ottimale ` +
      `(${simulatedClinicalMinutes} min vs benchmark ${recommendedMinutes} min). ` +
      (timeDependent
        ? "In patologie tempo-dipendenti ogni minuto di ritardo incrementa mortalità e morbilità."
        : "Il ritardo prolungato espone a rischio di deterioramento clinico non intercettato.");
    legalRiskNote =
      timeDependent
        ? "Nel profilo medico-legale della negligenza, il ritardo nella riperfusione (STEMI) o nella trombolisi " +
          "(ictus ischemico entro finestra terapeutica) può configurare imperizia grave con nesso di causalità " +
          "materiale rispetto all'esito neurologico o miocardico sfavorevole (perdita di chance)."
        : "Il ritardo eccessivo nella presa in carico, oltre la soglia di deterioramento prevista dal caso, " +
          "può integrare negligenza se correlato a un peggioramento evitabile con azioni tempestive del Gold Standard.";
  } else if (verdict === "OPTIMAL") {
    formalWarning =
      `Gestione temporale coerente con il benchmark del caso (${simulatedClinicalMinutes} min vs ${recommendedMinutes} min consigliati).`;
    legalRiskNote =
      "Nessuna anomalia temporale rilevante sotto il profilo della responsabilità professionale, salvo errori sostanziali nel percorso clinico.";
  } else {
    formalWarning =
      `Tempo di gestione nella norma operativa (${simulatedClinicalMinutes} min; benchmark ${recommendedMinutes} min).`;
    legalRiskNote =
      "Monitorare comunque l'aderenza alle linee guida tempo-dipendenti per patologie ad alto rischio.";
  }

  return {
    interactionSeconds,
    simulatedClinicalMinutes,
    recommendedMinutes,
    verdict,
    deltaMinutes,
    formalWarning,
    legalRiskNote,
    skippedBasicWorkup: skippedBasic,
    timeDependentPathology: timeDependent,
    guidelineReferences,
  };
}

/** Compatibilità con accounting server-side esistente (chat route). */
export function computeElapsedMinutesFromExamsWithHeavyCosts(
  requestedExamIds: string[],
  examLatencies: ExamLatenciesMap,
  examNameById?: Record<string, string>,
  fallbackMinutes = 5,
): number {
  if (examNameById && Object.keys(examNameById).length > 0) {
    return computeSimulatedClinicalMinutes({
      requestedExamIds,
      examNameById,
      caseLatencies: examLatencies,
    });
  }
  return computeElapsedMinutesFromExams(requestedExamIds, examLatencies, fallbackMinutes);
}
