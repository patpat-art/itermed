import { redirect } from "next/navigation";
import { CaseCreatorWizard } from "@/components/cases/CaseCreatorWizard";
import { isTeacherRole } from "@/lib/cases/require-teacher-api";
import { requireUser } from "@/lib/require-user";

export default async function CreateCasePage() {
  const user = await requireUser();

  if (!isTeacherRole(user.role)) {
    redirect("/dashboard/cases");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Crea Caso — Wizard Avanzato</h1>
        <p className="text-sm text-zinc-500">
          Configura anagrafica, latenze degli esami, percorso Gold Standard e soglie di deterioramento per
          simulazioni cliniche di livello formativo.
        </p>
      </header>
      <CaseCreatorWizard canPublishGlobal={user.role === "ADMIN"} />
    </div>
  );
}
