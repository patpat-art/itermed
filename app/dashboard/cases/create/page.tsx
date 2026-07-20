import Link from "next/link";
import { CaseCreatorWizard } from "@/components/cases/CaseCreatorWizard";
import { isTeacherRole } from "@/lib/cases/require-teacher-api";
import { requireUser } from "@/lib/require-user";

export default async function CreateCasePage() {
  const user = await requireUser();
  const canCreate = isTeacherRole(user.role);

  if (!canCreate) {
    return (
      <div className="flex flex-col gap-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50/80 px-6 py-8">
        <h1 className="font-display text-lg font-semibold text-[#2F4156]">
          Creazione casi riservata
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Solo docenti (INSTRUCTOR) e amministratori (ADMIN) possono aprire il wizard di creazione
          casi. Il tuo ruolo attuale è <span className="font-mono text-xs">{user.role}</span>.
        </p>
        <Link
          href="/dashboard/prassi"
          className="inline-flex w-fit rounded-xl bg-[#1E324E] px-4 py-2 text-sm font-medium text-white hover:bg-[#2A486D]"
        >
          Torna a Prassi Clinica
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-[#2F4156]">
          Crea Caso — Wizard Avanzato
        </h1>
        <p className="text-sm text-slate-500">
          Configura anagrafica, latenze degli esami, percorso Gold Standard e soglie di
          deterioramento per simulazioni cliniche di livello formativo.
        </p>
      </header>
      <CaseCreatorWizard canPublishGlobal={user.role === "ADMIN"} />
    </div>
  );
}
