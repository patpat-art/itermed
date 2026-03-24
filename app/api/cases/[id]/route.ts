import { prisma } from "../../../../lib/prisma";
import { userCanPlayCase } from "../../../../lib/access";
import { getSessionUserId } from "../../../../lib/api-session";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: caseId } = await context.params;

  const userId = await getSessionUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

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
      deck: true,
    },
  });

  if (!clinicalCase) {
    return new Response(JSON.stringify({ error: "Case not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const firstNode = clinicalCase.nodes[0];
  const casePrompt =
    (firstNode?.content as any)?.casePrompt ??
    `${clinicalCase.title}. ${clinicalCase.description}`;

  return new Response(
    JSON.stringify({
      id: clinicalCase.id,
      title: clinicalCase.title,
      description: clinicalCase.description,
      specialty: clinicalCase.specialty,
      difficulty: clinicalCase.difficulty,
      estimatedDurationMinutes: clinicalCase.estimatedDurationMinutes,
      deckTitle: clinicalCase.deck?.title ?? null,
      casePrompt,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

