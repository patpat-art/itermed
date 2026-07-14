import { userCanPlayCase } from "@/lib/access";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { evaluationService, computeTotalScore } from "@/lib/services/evaluation-service";
import { ragService } from "@/lib/services/rag-service";
import { getExamValuesCatalog } from "@/lib/exam-values-service";
import { resolveExamBudgetEuro } from "@/lib/services/evaluation-scoring";
import { hasActiveSubscription } from "@/lib/billing/access-gate";
import { getUserBillingProfile, incrementFreeTrialUsage } from "@/lib/billing/user-billing";
import {
  buildSessionReportData,
  type ClinicalCaseSnapshot,
} from "@/lib/services/simulation-report-data";
import type { ChatMessage, ExamPayload } from "@/lib/services/evaluation-service";

export type SimulationReportJobInput = {
  reportId: string;
  userId: string;
  caseId: string;
  evaluationChatHistory: ChatMessage[];
  exams: ExamPayload[];
  normalizedReportText: string;
  caseContext?: string;
  finalDiagnosis?: string;
};

export async function processSimulationReportJob(input: SimulationReportJobInput): Promise<void> {
  const log = createLogger("simulation-report-worker").child({
    reportId: input.reportId,
    caseId: input.caseId,
    userId: input.userId,
  });
  const jobStartedAt = Date.now();

  try {
    await prisma.sessionReport.update({
      where: { id: input.reportId },
      data: {
        status: "PROCESSING",
        progress: 20,
        progressMessage: "Preparazione analisi caso...",
      },
    });

    const allowed = await userCanPlayCase(input.userId, input.caseId);
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const prefetchStartedAt = Date.now();
    const [clinicalCase, guidelines, examCatalog] = await Promise.all([
      prisma.clinicalCase.findUnique({
        where: { id: input.caseId },
        select: {
          difficulty: true,
          medicalSpecialtyId: true,
          specialty: true,
          baselineExamFindings: true,
          goldStandardPath: true,
          medicalSpecialty: { select: { id: true, name: true } },
        },
      }),
      ragService.getRelevantGuidelines({
        finalDiagnosis: input.finalDiagnosis,
        caseContext: input.caseContext,
        reportText: input.normalizedReportText,
        specialtyName: input.caseContext,
      }),
      getExamValuesCatalog(),
    ]);
    const prefetchDurationMs = Date.now() - prefetchStartedAt;

    await prisma.sessionReport.update({
      where: { id: input.reportId },
      data: {
        progress: 40,
        progressMessage: "Confronto con linee guida e tutele legali...",
      },
    });

    const specialtyName =
      clinicalCase?.medicalSpecialty?.name ?? clinicalCase?.specialty ?? undefined;
    const caseDifficulty = clinicalCase?.difficulty;
    const examBudgetEuro = resolveExamBudgetEuro(
      caseDifficulty,
      clinicalCase?.baselineExamFindings,
    );

    log.info("Parallel prefetch completed", {
      prefetchDurationMs,
      legalSource: guidelines.legal.source,
      protocolSource: guidelines.protocol.source,
      specialtyName,
      difficulty: caseDifficulty,
      examBudgetEuro,
    });

    await prisma.sessionReport.update({
      where: { id: input.reportId },
      data: {
        progress: 70,
        progressMessage: "Generazione valutazione con GPT-4o...",
      },
    });

    const evaluationStartedAt = Date.now();
    const evaluation = await evaluationService.evaluateSimulation({
      chatHistory: input.evaluationChatHistory,
      exams: input.exams,
      reportText: input.normalizedReportText,
      caseContext: input.caseContext,
      finalDiagnosis: input.finalDiagnosis,
      guidelines,
      difficulty: caseDifficulty,
      specialty: specialtyName,
      examBudgetEuro,
      baselineExamFindings: clinicalCase?.baselineExamFindings,
      examCatalog,
      goldStandardPath: Array.isArray(clinicalCase?.goldStandardPath)
        ? (clinicalCase.goldStandardPath as string[])
        : undefined,
    });
    const evaluationDurationMs = Date.now() - evaluationStartedAt;

    const totalScore = computeTotalScore(evaluation.scores);
    const completedAt = new Date();

    const persistStartedAt = Date.now();
    await prisma.sessionReport.update({
      where: { id: input.reportId },
      data: buildSessionReportData({
        userId: input.userId,
        caseId: input.caseId,
        clinicalCase: clinicalCase as ClinicalCaseSnapshot,
        evaluationChatHistory: input.evaluationChatHistory,
        exams: input.exams,
        normalizedReportText: input.normalizedReportText,
        evaluation,
        guidelines,
        totalScore,
        completedAt,
      }),
    });
    const persistDurationMs = Date.now() - persistStartedAt;

    log.info("Simulation report completed", {
      totalScore,
      prefetchDurationMs,
      evaluationDurationMs,
      persistDurationMs,
      totalDurationMs: Date.now() - jobStartedAt,
    });

    const billingProfile = await getUserBillingProfile(input.userId);
    if (billingProfile && !hasActiveSubscription(billingProfile) && billingProfile.role !== "ADMIN") {
      await incrementFreeTrialUsage(input.userId);
    }
  } catch (error) {
    log.error("Simulation report job failed", {
      error,
      durationMs: Date.now() - jobStartedAt,
    });

    await prisma.sessionReport
      .update({
        where: { id: input.reportId },
        data: {
          status: "FAILED",
          progressMessage: "Errore durante la generazione.",
        },
      })
      .catch((updateError) => {
        log.error("Failed to mark report as FAILED", { updateError });
      });
  }
}
