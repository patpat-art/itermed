"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  type CaseDifficulty,
  DIFFICULTY_LABELS,
  displaySpecialtyName,
  isCaseDifficulty,
} from "@/lib/dashboard-case-utils";
import { cn } from "@/app/utils/cn";
import type { ClinicalCaseRow } from "@/components/dashboard/ClinicalCaseCard";

type PrassiShellProps = {
  cases: ClinicalCaseRow[];
  children: ReactNode;
};

const DIFFICULTY_BADGE: Record<CaseDifficulty, string> = {
  EASY: "bg-slate-50 text-slate-700 border border-slate-200/60",
  MEDIUM: "bg-amber-50/70 text-amber-800 border border-amber-200/50",
  HARD: "bg-rose-50/70 text-rose-800 border border-rose-200/50",
};

export function PrassiShell({ cases, children }: PrassiShellProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const queryCaseId = searchParams?.get("caseId") ?? null;
  const specialtyId = searchParams?.get("specialtyId") ?? null;
  const specialtyName = searchParams?.get("specialty") ?? null;
  const difficulty = searchParams?.get("difficulty") ?? null;
  const playMatch = pathname.match(/\/dashboard\/prassi\/play\/([^/]+)/);
  const isPlaying = Boolean(playMatch);
  const activeCaseId = playMatch?.[1] ?? queryCaseId ?? null;
  const safeCases = Array.isArray(cases) ? cases.filter(Boolean) : [];

  const visibleCases = safeCases.filter((c) => {
    if (!c?.id) return false;
    if (difficulty && c.difficulty !== difficulty) return false;
    if (specialtyName || specialtyId) {
      const label = (c.medicalSpecialty?.name ?? c.specialty ?? "").toLowerCase();
      const target = (specialtyName ?? "").toLowerCase();
      if (specialtyName && label !== target) return false;
    }
    return true;
  });

  const filterQuery = [
    specialtyId ? `specialtyId=${encodeURIComponent(specialtyId)}` : "",
    specialtyName ? `specialty=${encodeURIComponent(specialtyName)}` : "",
    difficulty ? `difficulty=${encodeURIComponent(difficulty)}` : "",
  ]
    .filter(Boolean)
    .join("&");

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {!isPlaying ? (
        <header className="mb-3 shrink-0 space-y-1 overflow-x-hidden">
          <h1 className="font-display text-xl font-semibold tracking-tight text-brand-primary">
            Prassi Clinica
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
            Libreria casi ed esercitazioni attive. Seleziona un caso a sinistra per aprire il
            briefing e avviare la simulazione.
          </p>
        </header>
      ) : null}

      {/* Within dashboard main (col-span-10): case list 3 + workspace 7 ≈ full-page 2|3|7 */}
      <div className="grid h-full min-h-0 w-full grid-cols-1 gap-4 overflow-hidden lg:grid-cols-10">
        <aside className="col-span-1 flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-panel-bg shadow-aequan-panel lg:col-span-3">
          <div className="shrink-0 border-b border-border-subtle px-4 py-3">
            <p className="font-display text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Libreria casi
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {visibleCases.length}{" "}
              {visibleCases.length === 1 ? "caso disponibile" : "casi disponibili"}
            </p>
          </div>
          <div className="h-full min-h-0 space-y-1.5 overflow-x-hidden overflow-y-auto p-2 pr-2 pb-8">
            {visibleCases.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-400">
                Nessun caso disponibile con i filtri attivi.
              </p>
            ) : (
              visibleCases.map((caseRow) => {
                const isActive = activeCaseId === caseRow.id;
                const specialty = displaySpecialtyName(caseRow);
                const difficultyKey = isCaseDifficulty(caseRow.difficulty)
                  ? caseRow.difficulty
                  : "MEDIUM";
                const difficultyLabel =
                  DIFFICULTY_LABELS[difficultyKey] ?? String(caseRow.difficulty ?? "Media");
                const href = `/dashboard/prassi?caseId=${encodeURIComponent(caseRow.id)}${
                  filterQuery ? `&${filterQuery}` : ""
                }`;
                return (
                  <Link
                    key={caseRow.id}
                    href={href}
                    className={cn(
                      "block overflow-x-hidden rounded-lg border px-3 py-3 transition-all duration-200",
                      isActive
                        ? "border-l-4 border-l-brand-primary border-y-border border-r-border bg-brand-secondary/[0.04] shadow-sm"
                        : "border-border hover:border-slate-300 hover:bg-ui-bg",
                    )}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-brand-secondary/15 bg-brand-secondary/10 px-2 py-0.5 text-[10px] font-medium text-brand-secondary">
                        {specialty}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          DIFFICULTY_BADGE[difficultyKey],
                        )}
                      >
                        {difficultyLabel}
                      </span>
                    </div>
                    <p className="font-display line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                      {caseRow.title ?? "Caso clinico"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {caseRow.isGlobal ? "Caso globale" : "Caso individuale"}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <section className="col-span-1 h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-panel-bg pr-2 pb-8 shadow-aequan-panel lg:col-span-7">
          <div className="h-full min-h-0 overflow-x-hidden p-3 sm:p-4">{children}</div>
        </section>
      </div>
    </div>
  );
}
