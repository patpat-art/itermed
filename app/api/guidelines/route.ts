import { getSessionUserId } from "@/lib/api-session";
import {
  fetchGuidelineDocumentById,
  fetchGuidelineDocuments,
} from "@/lib/guidelines/queries";

export const runtime = "nodejs";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Read-only listing of RAG guideline documents (guest sandbox + authenticated users). */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return jsonResponse({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim();
  const activeOnly = url.searchParams.get("activeOnly") === "true";

  if (id) {
    const doc = await fetchGuidelineDocumentById(id);
    if (!doc) {
      return jsonResponse({ error: "Not found", code: "NOT_FOUND" }, 404);
    }
    return jsonResponse({ document: doc });
  }

  const documents = await fetchGuidelineDocuments({ activeOnly });
  return jsonResponse({ documents, count: documents.length });
}
