import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { assertUserCanPlayCase } from "../../../../lib/access";
import { getSessionUserId } from "../../../../lib/api-session";
import { assertCanStartSimulation, gateToResponse } from "@/lib/billing/access-gate";
import { getUserBillingProfile } from "@/lib/billing/user-billing";

const bodySchema = z.object({
  caseId: z.string().min(1),
  mode: z.enum(["original", "variant"]),
});

const variantSchema = z.object({
  newPatientPrompt: z.string(),
  newCorrectSolution: z.string(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const json = await req.json();
  const { caseId, mode } = bodySchema.parse(json);

  const accessDenied = await assertUserCanPlayCase(userId, caseId);
  if (accessDenied) return accessDenied;

  const billingProfile = await getUserBillingProfile(userId);
  if (!billingProfile) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const simGate = assertCanStartSimulation(billingProfile);
  if (!simGate.allowed) {
    return gateToResponse(simGate);
  }

  const clinicalCase = await prisma.clinicalCase.findUnique({
    where: { id: caseId },
    include: {
      nodes: { orderBy: { order: "asc" }, take: 1 },
    },
  });

  if (!clinicalCase) {
    return new Response(JSON.stringify({ error: "Case not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const firstNode = clinicalCase.nodes[0];
  const basePrompt =
    (firstNode?.content as any)?.casePrompt ??
    `${clinicalCase.title}. ${clinicalCase.description}`;

  if (mode === "original") {
    const session = await prisma.caseSession.create({
      data: {
        userId,
        caseId,
        isVariant: false,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `
Modifica questo caso clinico cambiando età, sesso o aggiungendo/togliendo una comorbilità o farmaco.
Mantieni la presentazione coerente e realistica, ma sufficientemente diversa per costituire una nuova variante formativa.
COERENZA NOME–SESSO (TASSATIVA): se cambi il sesso del paziente, aggiorna anche il nome proprio nel newPatientPrompt affinché corrisponda (Sesso: Maschile → solo nomi maschili italiani; Sesso: Femminile → solo nomi femminili). Mai "Luca"/"Marco"/"Paolo" per una paziente donna, né "Lucia"/"Laura"/"Giulia" per un paziente uomo.
Restituisci un JSON con i campi:
- "newPatientPrompt": descrizione testuale del nuovo contesto/paziente (in seconda persona al modello, ma usata come prompt al paziente virtuale).
- "newCorrectSolution": breve descrizione della gestione clinico-medico-legale corretta per questa variante.
`.trim();

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    schema: variantSchema,
    prompt: `
Caso di partenza:
Titolo: ${clinicalCase.title}
Descrizione: ${clinicalCase.description}
Prompt paziente di base: ${basePrompt}
`.trim(),
  });

  const session = await prisma.caseSession.create({
    data: {
      userId,
      caseId,
      isVariant: true,
      variantPrompt: object.newPatientPrompt,
      variantSolution: object.newCorrectSolution,
    },
  });

  return new Response(JSON.stringify({ sessionId: session.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

