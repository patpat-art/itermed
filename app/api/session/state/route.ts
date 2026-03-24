import { prisma } from "../../../../lib/prisma";
import { getSessionUserId } from "../../../../lib/api-session";
import { verifyLiveSessionOwner } from "../../../../lib/access";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId missing" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const owns = await verifyLiveSessionOwner(sessionId, userId);
  if (!owns) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await prisma.caseSession.findUnique({
    where: { id: sessionId },
    include: { case: true },
  });

  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const target =
    session.currentTargetCondition ??
    session.variantSolution ??
    (session.case as any)?.correctSolution ??
    null;

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      targetCondition: target,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

