import { prisma } from "../../../lib/prisma";
import { getSessionUserId } from "../../../lib/api-session";
import { verifyLiveSessionOwner } from "../../../lib/access";
import { generatePatientResponse } from "../../../lib/simulator/generatePatientResponse";
import { buildPatientSimulatorCaseInput } from "../../../lib/simulator/patientCaseContext";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const { messages, casePrompt, sessionId, patientStress, caseId } = body;

  const stressRaw = Number(patientStress);
  const stressClamped = Number.isFinite(stressRaw)
    ? Math.max(0, Math.min(100, Math.round(stressRaw)))
    : 0;

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

  const chatMessages = Array.isArray(messages)
    ? (messages as { role: string; content: string }[]).filter(
        (m) =>
          (m.role === "user" || m.role === "assistant" || m.role === "system") &&
          typeof m.content === "string",
      )
    : [];

  const result = generatePatientResponse({
    caseData,
    messages: chatMessages as { role: "user" | "assistant" | "system"; content: string }[],
  });

  return result.toDataStreamResponse();
}
