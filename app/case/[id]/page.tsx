import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../../../lib/auth-options";
import { userCanPlayCase } from "../../../lib/access";
import { SimulatorClient } from "../../../components/simulator/SimulatorClient";

const FALLBACK_CASES: Record<
  string,
  {
    id: string;
    title: string;
    description: string;
    specialty: string | null;
    difficulty: string;
    estimatedDurationMinutes: number | null;
    patientPrompt: string;
  }
> = {
  demo: {
    id: "demo",
    title: "Scenario demo PS – dolore toracico",
    description:
      "Accesso in PS per dolore toracico oppressivo; obiettivo: anamnesi, scelta esami, referto e gestione difendibile.",
    specialty: "Emergenza / Cardiologia",
    difficulty: "MEDIUM",
    estimatedDurationMinutes: 12,
    patientPrompt:
      "Uomo 58 anni, dolore toracico oppressivo retrosternale irradiato al braccio sinistro, ansioso, sudorazione. Non dare diagnosi.",
  },
  cs_001: {
    id: "cs_001",
    title: "Dolore toracico in PS",
    description:
      "Dolore toracico acuto con sintomi associati. Focus su appropriatezza esami e sicurezza clinica.",
    specialty: "Emergenza",
    difficulty: "MEDIUM",
    estimatedDurationMinutes: 15,
    patientPrompt:
      "Paziente con dolore toracico acuto e dispnea. Rispondi da paziente ansioso, evita diagnosi e valori vitali a voce.",
  },
  cs_002: {
    id: "cs_002",
    title: "Febbre persistente in paziente anziano",
    description:
      "Febbre e astenia persistenti. Focus su raccolta anamnesi e tutela medico-legale nella documentazione.",
    specialty: "Medicina interna",
    difficulty: "EASY",
    estimatedDurationMinutes: 18,
    patientPrompt:
      "Paziente anziano con febbre persistente. Rispondi da paziente, non dare diagnosi, descrivi sintomi e preoccupazioni.",
  },
};

type CasePageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<{
        sessionId?: string;
      }>
    | {
        sessionId?: string;
      };
};

export default async function CasePage(props: CasePageProps) {
  const params = "then" in props.params ? await props.params : props.params;
  const searchParams =
    props.searchParams && "then" in props.searchParams
      ? await props.searchParams
      : props.searchParams;

  const rawId = params.id || "";
  const idNormalized = rawId.trim().toLowerCase();

  const hasDatabase = Boolean(process.env.DATABASE_URL);

  const sessionId = searchParams?.sessionId;

  // Se il database non è configurato, usiamo direttamente i casi demo.
  if (!hasDatabase) {
    const fallback = FALLBACK_CASES[idNormalized] ?? FALLBACK_CASES.demo;
    if (fallback) {
      return (
        <SimulatorClient
          initialCaseData={fallback}
          sessionId={sessionId}
          persistReports={false}
        />
      );
    }
    return notFound();
  }

  const authSession = await getServerSession(authOptions);
  if (!authSession?.user?.id) {
    const qs = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
    redirect(`/login?callbackUrl=${encodeURIComponent(`/case/${rawId}${qs}`)}`);
  }
  const userId = authSession.user.id;

  try {
    const canPlay = await userCanPlayCase(userId, rawId);
    if (!canPlay) {
      return notFound();
    }

    const [caseData, session] = await Promise.all([
      prisma.clinicalCase.findUnique({
        where: { id: rawId },
        include: { nodes: { orderBy: { order: "asc" }, take: 1 } },
      }),
      sessionId
        ? prisma.caseSession.findUnique({
            where: { id: sessionId },
          })
        : Promise.resolve(null),
    ]);

    if (
      sessionId &&
      (!session || session.userId !== userId || session.caseId !== rawId)
    ) {
      redirect(`/case/${rawId}`);
    }

    if (caseData) {
      const firstNode = caseData.nodes[0];
      const basePatientPrompt =
        (firstNode as any)?.content?.casePrompt ??
        "Paziente in simulazione. Rispondi come paziente, senza diagnosi e senza valori vitali a voce.";

      const isVariant = Boolean(session?.isVariant);
      const effectivePrompt = isVariant && session?.variantPrompt ? session.variantPrompt : basePatientPrompt;

      const baseline: any = (caseData as any).baselineExamFindings ?? {};
      const demographics = baseline.demographics ?? {};

      const initialCaseData = {
        id: caseData.id,
        title: caseData.title,
        description: caseData.description,
        specialty: caseData.specialty ?? null,
        difficulty: caseData.difficulty,
        estimatedDurationMinutes: caseData.estimatedDurationMinutes ?? null,
        patientPrompt: effectivePrompt,
        correctSolution: (caseData as any).correctSolution ?? null,
        demographics: {
          age: demographics.age ?? null,
          sex: demographics.sex ?? null,
          context: demographics.context ?? null,
        },
      };

      return (
        <SimulatorClient
          initialCaseData={initialCaseData}
          isVariant={isVariant}
          sessionId={session?.id ?? sessionId}
          persistReports
        />
      );
    }
  } catch {
    // DB non pronto
  }

  return notFound();
}
