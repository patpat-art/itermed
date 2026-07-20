import { redirect } from "next/navigation";

/** Legacy case library — Prassi Clinica is the canonical list surface. */
export default function DashboardCasesRedirectPage() {
  redirect("/dashboard/prassi");
}
