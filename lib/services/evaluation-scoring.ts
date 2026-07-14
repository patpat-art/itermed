import type { CaseDifficulty } from "@prisma/client";
import type { ExamClinicalMeta } from "@/lib/exam-default-values";
import type { ExamPayload } from "@/lib/services/evaluation-service";

export const CRITICAL_PENALTY_HIGH = 25;
export const CRITICAL_PENALTY_MEDIUM = 15;

export type CriticalActionItem = {
  description: string;
  performed: boolean;
  criticalLevel: "HIGH" | "MEDIUM";
  feedback: string;
};

export type InappropriateActionItem = {
  description: string;
  performed: boolean;
  penaltyWeight: number;
  feedback: string;
};

export type EmpathyChecklistItem = {
  parameter: string;
  met: boolean;
  feedback: string;
};

export type LegalInstrumentReview = {
  instrument: string;
  documentTitle?: string;
  compliance: "rispettato" | "violato" | "parziale" | "non_applicabile";
  rationale: string;
};

export type DimensionScores = {
  clinical: number;
  legal: number;
  exams: number;
  economy: number;
  empathy: number;
};

export type ScoreBreakdown = {
  clinical: {
    base: number;
    missedHigh: number;
    missedMedium: number;
    penaltyHigh: number;
    penaltyMedium: number;
    final: number;
  };
  exams: {
    base: number;
    penaltySum: number;
    performedInappropriateCount: number;
    final: number;
  };
  economy: {
    budgetEuro: number;
    totalCostEuro: number;
    formula: string;
    final: number;
  };
  legal: {
    applicableInstruments: number;
    violated: number;
    partial: number;
    weightPerInstrument: number;
    final: number;
  };
  empathy: {
    totalParameters: number;
    metParameters: number;
    final: number;
  };
};

const DEFAULT_BUDGET_BY_DIFFICULTY: Record<CaseDifficulty, number> = {
  EASY: 250,
  MEDIUM: 400,
  HARD: 600,
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Resolves per-case exam budget from baseline JSON or difficulty tier. */
export function resolveExamBudgetEuro(
  difficulty?: CaseDifficulty,
  baselineExamFindings?: unknown,
): number {
  const baseline = baselineExamFindings as { examBudgetEuro?: number } | null | undefined;
  if (typeof baseline?.examBudgetEuro === "number" && baseline.examBudgetEuro > 0) {
    return baseline.examBudgetEuro;
  }
  return DEFAULT_BUDGET_BY_DIFFICULTY[difficulty ?? "MEDIUM"];
}

/** Overlays authoritative exam prices from the catalog/DB config. */
export function resolveExamCostsFromCatalog(
  exams: ExamPayload[],
  catalog: Record<string, ExamClinicalMeta>,
): { exams: ExamPayload[]; totalCostEuro: number } {
  const resolved = exams.map((exam) => ({
    ...exam,
    cost: (catalog[exam.id]?.price ?? Number(exam.cost)) || 0,
  }));

  const totalCostEuro = resolved.reduce((sum, exam) => sum + (Number(exam.cost) || 0), 0);
  return { exams: resolved, totalCostEuro };
}

/**
 * Accuratezza clinica: 100 − 25 per ogni azione critica HIGH non eseguita,
 * −15 per ogni azione critica MEDIUM non eseguita.
 */
export function computeClinicalAccuracyScore(criticalActions: CriticalActionItem[]): {
  score: number;
  breakdown: ScoreBreakdown["clinical"];
} {
  const missedHigh = criticalActions.filter((a) => !a.performed && a.criticalLevel === "HIGH");
  const missedMedium = criticalActions.filter((a) => !a.performed && a.criticalLevel === "MEDIUM");
  const penaltyHigh = missedHigh.length * CRITICAL_PENALTY_HIGH;
  const penaltyMedium = missedMedium.length * CRITICAL_PENALTY_MEDIUM;
  const final = clampScore(100 - penaltyHigh - penaltyMedium);

  return {
    score: final,
    breakdown: {
      base: 100,
      missedHigh: missedHigh.length,
      missedMedium: missedMedium.length,
      penaltyHigh,
      penaltyMedium,
      final,
    },
  };
}

/**
 * Appropriatezza prescrittiva: 100 − somma penaltyWeight delle inappropriateActions eseguite.
 */
export function computeAppropriatenessScore(inappropriateActions: InappropriateActionItem[]): {
  score: number;
  breakdown: ScoreBreakdown["exams"];
} {
  const performed = inappropriateActions.filter((a) => a.performed);
  const penaltySum = performed.reduce((sum, a) => sum + Math.max(0, a.penaltyWeight), 0);
  const final = clampScore(100 - penaltySum);

  return {
    score: final,
    breakdown: {
      base: 100,
      penaltySum,
      performedInappropriateCount: performed.length,
      final,
    },
  };
}

/**
 * Sostenibilità economica: se costo ≤ budget → 100; altrimenti 100 × (budget / costo).
 */
export function computeEconomicSustainabilityScore(
  totalCostEuro: number,
  budgetEuro: number,
): { score: number; breakdown: ScoreBreakdown["economy"] } {
  if (totalCostEuro <= 0) {
    return {
      score: 100,
      breakdown: {
        budgetEuro,
        totalCostEuro: 0,
        formula: "Nessun esame a pagamento richiesto",
        final: 100,
      },
    };
  }

  if (totalCostEuro <= budgetEuro) {
    return {
      score: 100,
      breakdown: {
        budgetEuro,
        totalCostEuro,
        formula: "Costo entro budget",
        final: 100,
      },
    };
  }

  const raw = 100 * (budgetEuro / totalCostEuro);
  const final = clampScore(raw);

  return {
    score: final,
    breakdown: {
      budgetEuro,
      totalCostEuro,
      formula: `100 × (${budgetEuro} / ${totalCostEuro.toFixed(2)})`,
      final,
    },
  };
}

/**
 * Tutela legale: quota proporzionale per strumento applicabile dal corpus RAG.
 * violato → −100%; parziale → −50%; non_applicabile → ignorato.
 */
export function computeLegalComplianceScore(reviews: LegalInstrumentReview[]): {
  score: number;
  breakdown: ScoreBreakdown["legal"];
} {
  const applicable = reviews.filter((r) => r.compliance !== "non_applicabile");
  if (applicable.length === 0) {
    return {
      score: 100,
      breakdown: {
        applicableInstruments: 0,
        violated: 0,
        partial: 0,
        weightPerInstrument: 0,
        final: 100,
      },
    };
  }

  const weightPerInstrument = 100 / applicable.length;
  let penalty = 0;
  let violated = 0;
  let partial = 0;

  for (const review of applicable) {
    if (review.compliance === "violato") {
      penalty += weightPerInstrument;
      violated += 1;
    } else if (review.compliance === "parziale") {
      penalty += weightPerInstrument * 0.5;
      partial += 1;
    }
  }

  const final = clampScore(100 - penalty);

  return {
    score: final,
    breakdown: {
      applicableInstruments: applicable.length,
      violated,
      partial,
      weightPerInstrument: Math.round(weightPerInstrument * 100) / 100,
      final,
    },
  };
}

/** Empatia: (parametri soddisfatti / totali) × 100. */
export function computeEmpathyScore(checklist: EmpathyChecklistItem[]): {
  score: number;
  breakdown: ScoreBreakdown["empathy"];
} {
  if (checklist.length === 0) {
    return {
      score: 0,
      breakdown: { totalParameters: 0, metParameters: 0, final: 0 },
    };
  }

  const metParameters = checklist.filter((item) => item.met).length;
  const final = clampScore((metParameters / checklist.length) * 100);

  return {
    score: final,
    breakdown: {
      totalParameters: checklist.length,
      metParameters,
      final,
    },
  };
}

export function deriveDimensionScores(params: {
  criticalActions: CriticalActionItem[];
  inappropriateActions: InappropriateActionItem[];
  empathyChecklist: EmpathyChecklistItem[];
  legalInstrumentReviews: LegalInstrumentReview[];
  totalCostEuro: number;
  budgetEuro: number;
}): { scores: DimensionScores; breakdown: ScoreBreakdown } {
  const clinical = computeClinicalAccuracyScore(params.criticalActions);
  const exams = computeAppropriatenessScore(params.inappropriateActions);
  const economy = computeEconomicSustainabilityScore(params.totalCostEuro, params.budgetEuro);
  const legal = computeLegalComplianceScore(params.legalInstrumentReviews);
  const empathy = computeEmpathyScore(params.empathyChecklist);

  return {
    scores: {
      clinical: clinical.score,
      legal: legal.score,
      exams: exams.score,
      economy: economy.score,
      empathy: empathy.score,
    },
    breakdown: {
      clinical: clinical.breakdown,
      exams: exams.breakdown,
      economy: economy.breakdown,
      legal: legal.breakdown,
      empathy: empathy.breakdown,
    },
  };
}
