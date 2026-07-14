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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

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
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Casi</h1>
        <p className="text-sm text-zinc-400">
          Libreria casi clinici.
          {hasDatabase
            ? " Filtra per specialità e difficoltà, poi avvia un caso."
            : " Il database non è configurato: vengono mostrati solo esempi statici."}
        </p>
      </header>

      {hasDatabase && specialties.length > 0 ? (
        <Suspense fallback={<p className="text-xs text-zinc-500">Caricamento filtri…</p>}>
          <CaseFilters specialties={specialties} resultCount={source.length} />
        </Suspense>
      ) : null}

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Casi disponibili</CardTitle>
          <CardDescription>
            {source.length} {source.length === 1 ? "caso" : "casi"} corrispondenti ai filtri attivi.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-6">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
              Globali (tutti)
            </p>
            <ClinicalCaseGrid
              cases={globalCases}
              mode="start"
              emptyMessage="Nessun caso globale con questi filtri."
            />
          </section>
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
              I tuoi casi individuali
            </p>
            <ClinicalCaseGrid
              cases={personalCases}
              mode="start"
              emptyMessage="Nessun caso individuale con questi filtri."
            />
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
