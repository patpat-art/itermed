import type { AnalyticalEvaluation } from "@/lib/services/evaluation-service";
import type { FatalError } from "@/lib/services/evaluation-report-types";
import type { DimensionScores, ScoreBreakdown } from "@/lib/services/evaluation-scoring";
import type { MilestoneScoreBreakdown } from "@/lib/services/evaluation-milestone-scoring";
import {
  MACRO_AREA_WEIGHTS,
  computeTotalScoreTrentesimi,
} from "@/lib/services/evaluation-scoring";

const KILLER_SWITCH_CAP = 17.9;
const FATAL_OMISSION_PATTERN =
  /tc\s*encefal|tac\s*encefal|ictus|stroke|fibrinol|rtpa|alteplase|allerg|anafil|controindic|emorragia cerebr|stemi|infarto acut/i;

/** Detects clinically fatal errors from structured evaluation checklist. */
export function detectFatalErrors(analytical: AnalyticalEvaluation): FatalError[] {
  const seen = new Set<string>();
  const errors: FatalError[] = [];

  const push = (description: string, rationale: string) => {
    const key = description.slice(0, 80);
    if (seen.has(key)) return;
    seen.add(key);
    errors.push({ description, rationale });
  };

  for (const action of analytical.criticalActions) {
    if (!action.performed && action.criticalLevel === "HIGH") {
      push(action.description, action.feedback);
    }
  }

  for (const action of analytical.inappropriateActions) {
    if (action.performed && action.penaltyWeight >= 30) {
      push(`Azione inappropriata: ${action.description}`, action.feedback);
    }
  }

  for (const row of analytical.clinicalDeltaTable) {
    if (row.status !== "MISSED" && row.status !== "DELAYED") continue;
    const combined = `${row.protocolAction} ${row.penaltyOrBonusReason}`;
    const isFatalPattern = FATAL_OMISSION_PATTERN.test(combined);
    const isLifeThreatening =
      /red flag|salvavita|emergenza|entro\s*\d|fatale|catastrof/i.test(combined);
    if (isFatalPattern || (row.status === "MISSED" && isLifeThreatening)) {
      push(row.protocolAction, row.penaltyOrBonusReason);
    }
  }

  for (const review of analytical.legalInstrumentReviews) {
    if (review.compliance === "violato" && /gelli|24\/2017|consenso|allerg|farmaco/i.test(review.instrument + review.rationale)) {
      push(`Violazione ${review.instrument}`, review.rationale);
    }
  }

  for (const fatal of analytical.fatalErrors ?? []) {
    push(fatal.description, fatal.rationale);
  }

  return errors;
}

/** Killer Switch: fatal clinical error caps final grade below 18/30. */
export function applyKillerSwitch(totalScore: number, fatalErrors: FatalError[]): number {
  if (fatalErrors.length === 0) return totalScore;
  return Math.min(totalScore, KILLER_SWITCH_CAP);
}

export type MacroAreaRationale = {
  label: string;
  weightPercent: number;
  scorePercent: number;
  contributionTrentesimi: number;
  rationale: string;
};

export function buildMacroAreaRationales(
  scores: DimensionScores,
  breakdown: ScoreBreakdown,
  milestoneBreakdown?: MilestoneScoreBreakdown,
): MacroAreaRationale[] {
  const mb = milestoneBreakdown;

  return [
    {
      label: "Accuratezza Clinica",
      weightPercent: MACRO_AREA_WEIGHTS.clinicalDiagnostic * 100,
      scorePercent: scores.clinical,
      contributionTrentesimi:
        Math.round(((scores.clinical / 100) * MACRO_AREA_WEIGHTS.clinicalDiagnostic * 30) * 10) / 10,
      rationale: mb
        ? `Deterministico: ${mb.clinical.goldStepsMet}/${mb.clinical.goldStepsExpected} step Gold Standard + ${mb.clinical.met} milestone clinici (${mb.clinical.ratePercent}%).`
        : `Accuratezza diagnostico-terapeutica: ${breakdown.clinical.final}/100.`,
    },
    {
      label: "Sicurezza del Paziente",
      weightPercent: MACRO_AREA_WEIGHTS.legalCompliance * 100,
      scorePercent: scores.legal,
      contributionTrentesimi:
        Math.round(((scores.legal / 100) * MACRO_AREA_WEIGHTS.legalCompliance * 30) * 10) / 10,
      rationale: mb
        ? `Allergie/farmaci/parametri: ${mb.safety.met}/${mb.safety.expected} controlli (${mb.safety.vitalsMet ? "monitoraggio presente" : "monitoraggio assente"}).`
        : `Sicurezza paziente: ${breakdown.legal.final}/100.`,
    },
    {
      label: "Appropriatezza Economica e Clinica",
      weightPercent: MACRO_AREA_WEIGHTS.economicSustainability * 100,
      scorePercent: scores.exams,
      contributionTrentesimi:
        Math.round(((scores.exams / 100) * MACRO_AREA_WEIGHTS.economicSustainability * 30) * 10) / 10,
      rationale: mb
        ? `Base 100% − ${mb.appropriateness.penaltyPercent}% (${mb.appropriateness.inappropriateCount} inappropriate + ${mb.appropriateness.tier3WithoutIndication} esami III livello senza indicazione). Budget €${breakdown.economy.budgetEuro} vs €${breakdown.economy.totalCostEuro.toFixed(2)}.`
        : `Appropriatezza prescrittiva: ${breakdown.exams.final}/100.`,
    },
    {
      label: "Comunicazione ed Empatia",
      weightPercent: MACRO_AREA_WEIGHTS.empathy * 100,
      scorePercent: scores.empathy,
      contributionTrentesimi:
        Math.round(((scores.empathy / 100) * MACRO_AREA_WEIGHTS.empathy * 30) * 10) / 10,
      rationale: mb
        ? `Milestone empatici: ${mb.empathy.met}/${mb.empathy.expected} (rassicurazione, gestione stress).`
        : `Empatia: ${breakdown.empathy.metParameters}/${breakdown.empathy.totalParameters} parametri.`,
    },
  ];
}

export function computeFinalTrentesimiWithKillerSwitch(
  scores: DimensionScores,
  fatalErrors: FatalError[],
): { rawTotal: number; finalTotal: number; killerSwitchApplied: boolean; adjustedScores: DimensionScores } {
  let adjustedScores = scores;
  if (fatalErrors.length > 0) {
    adjustedScores = { ...scores, legal: 0 };
  }
  const rawTotal = computeTotalScoreTrentesimi(scores);
  const cappedRaw = computeTotalScoreTrentesimi(adjustedScores);
  const finalTotal = applyKillerSwitch(cappedRaw, fatalErrors);
  return {
    rawTotal,
    finalTotal,
    killerSwitchApplied: fatalErrors.length > 0 && finalTotal < rawTotal,
    adjustedScores,
  };
}

export { computeTotalScoreTrentesimi };
