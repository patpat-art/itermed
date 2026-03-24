import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { userCanPlayCase } from "../../../../lib/access";
import { getSessionUserId } from "../../../../lib/api-session";

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

  const allowed = await userCanPlayCase(userId, caseId);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
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

