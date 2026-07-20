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

  const caseList = (
    <>
      <div className="shrink-0 border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
        <p className="font-display text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Libreria casi
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {visibleCases.length}{" "}
          {visibleCases.length === 1 ? "caso disponibile" : "casi disponibili"}
        </p>
      </div>
      <div className="h-full min-h-0 space-y-1.5 overflow-y-auto overflow-x-hidden p-2 pr-2 pb-8">
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
                  "block min-w-0 overflow-x-hidden rounded-lg border px-2.5 py-2.5 transition-all duration-200",
                  isActive
                    ? "border-l-4 border-l-brand-primary border-y-border border-r-border bg-brand-secondary/[0.04] shadow-sm"
                    : "border-border hover:border-slate-300 hover:bg-ui-bg",
                )}
              >
                <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-1">
                  <span className="max-w-full truncate rounded-full border border-brand-secondary/15 bg-brand-secondary/10 px-2 py-0.5 text-[10px] font-medium text-brand-secondary">
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
                <p className="mt-1 truncate text-[11px] text-slate-400">
                  {caseRow.isGlobal ? "Caso globale" : "Caso individuale"}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      {!isPlaying ? (
        <header className="mb-3 shrink-0 space-y-1 overflow-x-hidden px-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-brand-primary">
            Prassi Clinica
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
            Libreria casi ed esercitazioni attive. Seleziona un caso a sinistra per aprire il
            briefing e avviare la simulazione.
          </p>
        </header>
      ) : null}

      {/* Strict 12-col: cases 2–3 | workspace 9–10 (simulator splits middle 6–7 + right 3) */}
      <div className="grid min-h-0 w-full flex-1 grid-cols-12 gap-6 overflow-hidden overflow-x-hidden">
        <aside
          className={cn(
            "col-span-12 flex h-full min-h-0 min-w-0 flex-col overflow-hidden overflow-x-hidden pr-2",
            "lg:col-span-3 xl:col-span-2",
            "border-r border-slate-200 dark:border-slate-800",
            !isPlaying && "rounded-xl border border-border bg-panel-bg shadow-aequan-panel lg:border-r",
          )}
        >
          {caseList}
        </aside>

        <section
          className={cn(
            "col-span-12 flex h-full min-h-0 min-w-0 flex-col overflow-hidden overflow-x-hidden",
            "lg:col-span-9 xl:col-span-10",
            !isPlaying && "rounded-xl border border-border bg-panel-bg p-3 shadow-aequan-panel sm:p-4",
          )}
        >
          <div className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
