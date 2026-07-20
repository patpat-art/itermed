import type { ReactNode } from "react";
import { Suspense } from "react";
import { config } from "@/lib/config";
import { requireUser } from "@/lib/require-user";
import {
  fetchFilteredClinicalCases,
  type CaseFilterParams,
} from "@/lib/dashboard-queries";
import { PrassiShell } from "@/components/prassi/PrassiShell";
import type { ClinicalCaseRow } from "@/components/dashboard/ClinicalCaseCard";

type PrassiLayoutProps = {
  children: ReactNode;
};

const DEMO_CASES = (userId: string): ClinicalCaseRow[] => [
  {
    id: "cs_001",
    title: "Uomo 58 anni con dolore toracico in PS",
    specialty: "Emergenza",
    difficulty: "MEDIUM",
    createdById: "seed",
    isGlobal: true,
  },
  {
    id: "cs_002",
    title: "Donna 72 anni con febbre persistente",
    specialty: "Medicina interna",
    difficulty: "EASY",
    createdById: userId,
    isGlobal: false,
  },
  {
    id: "cs_003",
    title: "Uomo 33 anni con idrocefalo e cefalea acuta",
    specialty: "Neurologia",
    difficulty: "HARD",
    createdById: "seed",
    isGlobal: true,
  },
];

async function loadCases(): Promise<ClinicalCaseRow[]> {
  const user = await requireUser();
  const hasDatabase = Boolean(config.DATABASE_URL) && !config.DATABASE_URL.includes("itermed_dev");

  if (!hasDatabase) {
    return DEMO_CASES(user.id);
  }

  try {
    const filters: CaseFilterParams = {};
    const rows = await fetchFilteredClinicalCases(user.id, filters, 60);
    return rows as ClinicalCaseRow[];
  } catch {
    return DEMO_CASES(user.id);
  }
}

export default async function PrassiLayout({ children }: PrassiLayoutProps) {
  const cases = await loadCases();

  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-100 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Caricamento Prassi Clinica…
        </div>
      }
    >
      <PrassiShell cases={cases}>{children}</PrassiShell>
    </Suspense>
  );
}
