import { CaseCreatorWizard } from "@/components/cases/CaseCreatorWizard";
import { requireUser } from "@/lib/require-user";

export default async function CreateCasePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-[#2F4156]">
          Crea Caso — Wizard Avanzato
        </h1>
        <p className="text-sm text-slate-500">
          Configura anagrafica, latenze degli esami, percorso Gold Standard e soglie di
          deterioramento per simulazioni cliniche di livello formativo. Usa la compilazione
          rapida con IA AEQUAN per generare una bozza completa da rivedere.
        </p>
      </header>
      <CaseCreatorWizard canPublishGlobal={user.role === "ADMIN"} />
    </div>
  );
}
