import { redirect } from "next/navigation";

/** Legacy ingest page — merged into Linee Guida hub. */
export default function NewKnowledgeRedirect() {
  redirect("/dashboard/guidelines?tab=ingest");
}
