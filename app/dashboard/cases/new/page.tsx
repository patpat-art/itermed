import { redirect } from "next/navigation";

/** Legacy create-case form — unified under /dashboard/cases/create. */
export default function NewCaseRedirectPage() {
  redirect("/dashboard/cases/create");
}
