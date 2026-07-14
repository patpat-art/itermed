import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "../../../../lib/prisma";
import { getSessionUserId } from "../../../../lib/api-session";
import { isDevAuthBypass } from "../../../../lib/require-user";
import type {
  ClinicalDeltaRow,
  CoachingFeedback,
  EconomicAnalysis,
  LegalProtectionStatus,
} from "@/lib/services/evaluation-report-types";
import { EliteResultsClient } from "./EliteResultsClient";

type ResultsPageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ sessionId?: string }> | { sessionId?: string };
};

type SessionTrace = {
  feedback?: {
    strengths?: string[];
    weaknesses?: string[];
    correctSolution?: string;
  };
  dismissed?: boolean;
  evidence?: { legalSources?: string[] };
  analytical?: {
    legalProtectionStatus?: LegalProtectionStatus;
    clinicalDeltaTable?: ClinicalDeltaRow[];
    economicAnalysis?: EconomicAnalysis;
    coachingFeedback?: CoachingFeedback;
  };
};

export default async function CaseResultsPage({ params, searchParams }: ResultsPageProps) {
  const resolvedParams = "then" in params ? await params : params;
  const resolvedSearch =
    searchParams && "then" in searchParams ? await searchParams : searchParams;

  const sessionId = resolvedSearch?.sessionId;
  const caseId = resolvedParams.id;

  if (!sessionId) {
    return notFound();
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return notFound();
  }

  const session = await prisma.sessionReport.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.caseId !== caseId) {
    return notFound();
  }

  if (!isDevAuthBypass() && session.userId !== userId) {
    return notFound();
  }

  const trace = (session.rawTrace ?? {}) as SessionTrace;

  const radarData = [
    { metric: "Accuratezza clinica", key: "clinicalAccuracy", score: session.clinicalAccuracy },
    { metric: "Tutela medico-legale", key: "legalComplianceGelliBianco", score: session.legalComplianceGelliBianco },
    { metric: "Appropriatezza esami", key: "prescribingAppropriateness", score: session.prescribingAppropriateness },
    { metric: "Sostenibilità economica", key: "economicSustainability", score: session.economicSustainability },
    { metric: "Empatia", key: "empathy", score: session.empathy },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-stretch justify-center px-4 py-10">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <div className="flex justify-start">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        <EliteResultsClient
          totalScore={session.totalScore}
          radarData={radarData}
          dismissed={Boolean(trace.dismissed)}
          strengths={trace.feedback?.strengths ?? []}
          weaknesses={trace.feedback?.weaknesses ?? []}
          correctSolution={trace.feedback?.correctSolution}
          legalProtectionStatus={trace.analytical?.legalProtectionStatus}
          clinicalDeltaTable={trace.analytical?.clinicalDeltaTable}
          economicAnalysis={trace.analytical?.economicAnalysis}
          coachingFeedback={trace.analytical?.coachingFeedback}
          legalSources={trace.evidence?.legalSources ?? []}
        />
      </div>
    </div>
  );
}
