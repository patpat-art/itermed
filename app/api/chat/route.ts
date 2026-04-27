import { prisma } from "../../../lib/prisma";
import { getSessionUserId } from "../../../lib/api-session";
import { verifyLiveSessionOwner } from "../../../lib/access";
import { generatePatientResponse } from "../../../lib/simulator/generatePatientResponse";
import { buildPatientSimulatorCaseInput } from "../../../lib/simulator/patientCaseContext";

type ChatBody = Record<string, unknown> & {
  messages?: unknown;
  casePrompt?: unknown;
  sessionId?: unknown;
  patientStress?: unknown;
  caseId?: unknown;
};

type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

function clampStress(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
}

function normalizeChatMessages(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return (raw as { role: string; content: string }[]).filter(
    (m) =>
      (m.role === "user" || m.role === "assistant" || m.role === "system") &&
      typeof m.content === "string",
  ) as ChatTurn[];
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await req.json()) as ChatBody;
  const { messages, casePrompt, sessionId, patientStress, caseId } = body;
  const stressClamped = clampStress(patientStress);

  let sessionVariantPrompt: string | null = null;
  if (sessionId) {
    const ok = await verifyLiveSessionOwner(String(sessionId), userId);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const session = await prisma.caseSession.findUnique({ where: { id: String(sessionId) } });
    if (session?.variantPrompt) {
      sessionVariantPrompt = session.variantPrompt;
    }
  }

  let clinicalCase: {
    description: string;
    correctSolution: string | null;
    baselineExamFindings: unknown;
  } | null = null;

  if (caseId && typeof caseId === "string" && caseId.trim()) {
    const row = await prisma.clinicalCase.findUnique({
      where: { id: caseId.trim() },
      select: {
        description: true,
        correctSolution: true,
        baselineExamFindings: true,
      },
    });
    if (row) {
      clinicalCase = row;
    }
  }

  let caseData = buildPatientSimulatorCaseInput({
    body: { ...body, casePrompt },
    clinicalCase,
    patientStress: stressClamped,
  });

  if (sessionVariantPrompt) {
    caseData = {
      ...caseData,
      chiefComplaint: `${caseData.chiefComplaint}\n\nVariante di scenario (contesto aggiuntivo per la simulazione):\n${sessionVariantPrompt}`,
    };
  }

  const chatMessages = normalizeChatMessages(messages);

  const result = generatePatientResponse({
    caseData,
    messages: chatMessages,
  });

  return result.toDataStreamResponse();
}
