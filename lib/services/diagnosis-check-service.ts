import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseGoldStandardPath } from "@/lib/cases/simulation-time";
import { fetchSessionMilestones } from "@/lib/simulator/milestone-tracker";
import {
  alignDiagnosis,
  computeMilestoneCompletionRate,
  type DiagnosisAlignerResult,
} from "@/lib/services/semantic-diagnosis-aligner";

export type CheckDiagnosisInput = {
  caseId: string;
  sessionId?: string;
  diagnosisText: string;
  caseTitle: string;
  caseDescription: string;
  expectedDiagnosis: string;
};

export async function checkStudentDiagnosis(
  input: CheckDiagnosisInput,
): Promise<DiagnosisAlignerResult> {
  let milestoneCompletionRate: number | undefined;

  if (input.sessionId) {
    const session = await prisma.caseSession.findUnique({
      where: { id: input.sessionId },
      select: {
        completedGoldSteps: true,
        case: { select: { goldStandardPath: true } },
      },
    });

    if (session) {
      const milestones = await fetchSessionMilestones(input.sessionId);
      const goldPath = parseGoldStandardPath(session.case?.goldStandardPath);
      milestoneCompletionRate = computeMilestoneCompletionRate({
        goldStandardPath: goldPath,
        completedGoldSteps: session.completedGoldSteps,
        sessionMilestones: milestones,
      });
    }
  }

  return alignDiagnosis({
    userDiagnosis: input.diagnosisText,
    expectedDiagnosis: input.expectedDiagnosis,
    caseTitle: input.caseTitle,
    caseDescription: input.caseDescription,
    milestoneCompletionRate,
  });
}

export const diagnosisVerdictSchema = z.object({
  isCorrect: z.boolean(),
  rationale: z.string(),
  expectedCondition: z.string().optional(),
  standardizedDiagnosis: z.string().optional(),
  confidence: z.number().optional(),
  method: z.string().optional(),
  milestoneCompletionRate: z.number().optional(),
});
