import { redirect } from "next/navigation";

/** Legacy RAG admin — merged into /dashboard/guidelines. */
export default function KnowledgeAdminRedirect() {
  redirect("/dashboard/guidelines");
}
