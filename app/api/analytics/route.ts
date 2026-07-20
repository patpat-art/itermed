import { fetchAnalyticsPageData } from "@/lib/analytics/analytics-queries";
import { getSessionUserId } from "@/lib/api-session";
import { toApiErrorResponse } from "@/lib/errors";
import { AI_RATE_LIMITS } from "@/lib/security/ai-rate-limits";
import { enforceLLMRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rateLimited = await enforceLLMRateLimit(req, {
    namespace: "api-analytics",
    limit: AI_RATE_LIMITS.analytics,
    userId,
  });
  if (rateLimited) return rateLimited;

  try {
    const data = await fetchAnalyticsPageData(userId);
    return Response.json(data);
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
