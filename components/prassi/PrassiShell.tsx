"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import type { CaseDifficulty } from "@prisma/client";
import { DIFFICULTY_LABELS, displaySpecialtyName } from "@/lib/dashboard-queries";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryCaseId = searchParams.get("caseId");
  const specialtyId = searchParams.get("specialtyId");
  const specialtyName = searchParams.get("specialty");
  const difficulty = searchParams.get("difficulty");
  const playMatch = pathname.match(/\/dashboard\/prassi\/play\/([^/]+)/);
  const activeCaseId = playMatch?.[1] ?? queryCaseId ?? null;

  const visibleCases = cases.filter((c) => {
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
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-5">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#2F4156]">
          Prassi Clinica
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
          Libreria casi ed esercitazioni attive basate su RAG e linee guida ministeriali.
          Seleziona un caso a sinistra per aprire il briefing clinico e avviare la simulazione.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
        <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white/95 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-4 xl:col-span-3">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-display text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Libreria casi
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {visibleCases.length}{" "}
              {visibleCases.length === 1 ? "caso disponibile" : "casi disponibili"}
            </p>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
              {visibleCases.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-400">
                  Nessun caso disponibile con i filtri attivi.
                </p>
              ) : (
                visibleCases.map((caseRow) => {
                  const isActive = activeCaseId === caseRow.id;
                  const specialty = displaySpecialtyName(caseRow);
                  const difficultyLabel =
                    DIFFICULTY_LABELS[caseRow.difficulty] ?? caseRow.difficulty;
                  const href = `/dashboard/prassi?caseId=${encodeURIComponent(caseRow.id)}${
                    filterQuery ? `&${filterQuery}` : ""
                  }`;
                  return (
                    <Link
                      key={caseRow.id}
                      href={href}
                      className={cn(
                        "block rounded-lg border px-3 py-3 transition-all duration-300",
                        isActive
                          ? "border-l-4 border-l-[#1E324E] border-y-slate-100 border-r-slate-100 bg-[#345884]/[0.04] shadow-sm"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/80",
                      )}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-[#345884]/15 bg-[#345884]/10 px-2 py-0.5 text-[10px] font-medium text-[#345884]">
                          {specialty}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            DIFFICULTY_BADGE[caseRow.difficulty],
                          )}
                        >
                          {difficultyLabel}
                        </span>
                      </div>
                      <p className="font-display line-clamp-2 text-sm font-semibold leading-snug text-[#2F4156]">
                        {caseRow.title}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {caseRow.isGlobal ? "Caso globale" : "Caso individuale"}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="shrink-0 border-t border-slate-100 bg-gradient-to-t from-[#345884]/[0.04] to-transparent px-3 py-3">
              <p className="text-[10px] leading-relaxed text-slate-500">
                Ogni scenario simulato è calibrato sulle ultime raccomandazioni della Legge
                Gelli-Bianco e sulle linee guida ministeriali per promuovere l&apos;appropriatezza
                prescrittiva.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-h-[420px] min-w-0 overflow-hidden rounded-xl border border-slate-200/60 bg-white/95 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-8 xl:col-span-9">
          {children}
        </section>
      </div>
    </div>
  );
}
