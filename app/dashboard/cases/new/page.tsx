import { NewCaseFormClient } from "../../../../components/cases/NewCaseFormClient";

export default function NewCasePage() {
  const roleHint = "Gli admin possono rendere un caso globale.";
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Nuovo caso clinico</h1>
        <p className="text-sm text-zinc-400">
          Definisci anagrafica, diagnosi ed esami alterati; oppure genera il profilo esami completo con l&apos;AI prima di salvare.
        </p>
      </header>

      <NewCaseFormClient roleHint={roleHint} />
    </div>
  );
}
