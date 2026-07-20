import { Suspense } from "react";
import { config } from "../../../lib/config";
import { requireUser } from "../../../lib/require-user";
import {
  fetchFilteredClinicalCases,
  fetchMedicalSpecialtyOptions,
  parseCaseDifficulty,
  type CaseFilterParams,
} from "../../../lib/dashboard-queries";
import { CaseFilters } from "../../../components/dashboard/CaseFilters";
import { ClinicalCaseGrid } from "../../../components/dashboard/ClinicalCaseGrid";
import { type ClinicalCaseRow } from "../../../components/dashboard/ClinicalCaseCard";

type DashboardCasesPageProps = {
  searchParams?:
    | Promise<{ specialtyId?: string; specialty?: string; difficulty?: string }>
    | { specialtyId?: string; specialty?: string; difficulty?: string };
};

const DEMO_CASES = (userId: string): ClinicalCaseRow[] => [
  {
    id: "cs_001",
    title: "Dolore toracico in PS",
    specialty: "Emergenza",
    difficulty: "MEDIUM",
    createdById: "seed",
    isGlobal: true,
  },
  {
    id: "cs_002",
    title: "Febbre persistente in paziente anziano",
    specialty: "Medicina interna",
    difficulty: "EASY",
    createdById: userId,
    isGlobal: false,
  },
];

function filterDemoCases(cases: ClinicalCaseRow[], filters: CaseFilterParams): ClinicalCaseRow[] {
  return cases.filter((c) => {
    if (filters.difficulty && c.difficulty !== filters.difficulty) return false;
    if (filters.specialtyId) {
      const specialtyName = c.medicalSpecialty?.name ?? c.specialty ?? "";
      if (specialtyName.toLowerCase() !== filters.specialtyId.toLowerCase()) return false;
    }
    return true;
  });
}

export default async function DashboardCasesPage({ searchParams }: DashboardCasesPageProps) {
  const user = await requireUser();
  const hasDatabase = Boolean(config.DATABASE_URL);
  const resolvedSearch =
    searchParams && "then" in searchParams ? await searchParams : searchParams;

  const filters: CaseFilterParams = {
    specialtyId: resolvedSearch?.specialtyId,
    specialtyName: resolvedSearch?.specialty,
    difficulty: parseCaseDifficulty(resolvedSearch?.difficulty),
  };

  let cases: ClinicalCaseRow[] | null = null;
  let specialties: { id: string; name: string }[] = [];

  if (hasDatabase) {
    try {
      const [caseRows, specialtyRows] = await Promise.all([
        fetchFilteredClinicalCases(user.id, filters),
        fetchMedicalSpecialtyOptions(),
      ]);
      cases = caseRows as ClinicalCaseRow[];
      specialties = specialtyRows;
    } catch {
      cases = null;
    }
  }

  const source = cases ?? filterDemoCases(DEMO_CASES(user.id), filters);
  const globalCases = source.filter((c) => c.isGlobal);
  const personalCases = source.filter((c) => !c.isGlobal && c.createdById === user.id);

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Casi</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
          Libreria casi clinici medico-legali.
          {hasDatabase
            ? " Filtra per specialità e difficoltà, poi avvia un caso o genera una variante IA."
            : " Il database non è configurato: vengono mostrati solo esempi statici."}
        </p>
      </header>

      {hasDatabase && specialties.length > 0 ? (
        <Suspense fallback={<p className="text-xs text-slate-400">Caricamento filtri…</p>}>
          <CaseFilters specialties={specialties} resultCount={source.length} />
        </Suspense>
      ) : null}

      <div className="space-y-10">
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Globali
            </h2>
            <span className="text-xs text-slate-400">
              {globalCases.length} {globalCases.length === 1 ? "caso" : "casi"}
            </span>
          </div>
          <ClinicalCaseGrid
            cases={globalCases}
            mode="start"
            emptyMessage="Nessun caso globale con questi filtri."
          />
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              I tuoi casi individuali
            </h2>
            <span className="text-xs text-slate-400">
              {personalCases.length} {personalCases.length === 1 ? "caso" : "casi"}
            </span>
          </div>
          <ClinicalCaseGrid
            cases={personalCases}
            mode="start"
            emptyMessage="Nessun caso individuale con questi filtri."
          />
        </section>
      </div>
    </div>
  );
}
