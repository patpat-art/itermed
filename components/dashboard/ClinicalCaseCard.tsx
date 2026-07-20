"use client";

import Link from "next/link";
import type { CaseDifficulty } from "@prisma/client";
import { StartCaseButtons } from "@/components/cases/StartCaseButtons";
import { DIFFICULTY_LABELS, displaySpecialtyName } from "@/lib/dashboard-queries";

export type ClinicalCaseRow = {
  id: string;
  title: string;
  specialty: string | null;
  difficulty: CaseDifficulty;
  createdById: string;
  isGlobal: boolean;
  medicalSpecialty?: { name: string } | null;
};

type ClinicalCaseCardProps = {
  caseRow: ClinicalCaseRow;
  mode?: "start" | "link";
  onSessionStart?: (caseId: string, sessionId: string) => void;
};

const DIFFICULTY_BADGE_STYLES: Record<CaseDifficulty, string> = {
  EASY: "bg-amber-50 text-amber-800 border border-amber-100",
  MEDIUM: "bg-amber-50 text-amber-900 border border-amber-200/80",
  HARD: "bg-amber-100 text-amber-950 border border-amber-200",
};

export function ClinicalCaseCard({
  caseRow,
  mode = "start",
  onSessionStart,
}: ClinicalCaseCardProps) {
  const specialtyLabel = displaySpecialtyName(caseRow);
  const difficultyLabel = DIFFICULTY_LABELS[caseRow.difficulty] ?? caseRow.difficulty;
  const difficultyStyle =
    DIFFICULTY_BADGE_STYLES[caseRow.difficulty] ?? "bg-slate-100 text-slate-600";

  const cardClassName =
    "rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md";

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#345884]/15 bg-[#345884]/10 px-2.5 py-1 text-xs font-medium text-[#345884]">
          {specialtyLabel}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}>
          {difficultyLabel}
        </span>
      </div>

      <h3 className="font-display mt-3 mb-1 text-base font-semibold leading-snug text-[#2F4156]">
        {caseRow.title}
      </h3>

      <p className="text-xs text-slate-400">
        {caseRow.isGlobal ? "Caso globale" : "Caso individuale"}
      </p>

      {mode === "start" ? (
        <div className="mt-5 pt-1">
          <StartCaseButtons caseId={caseRow.id} onSessionStart={onSessionStart} />
        </div>
      ) : null}
    </div>
  );

  if (mode === "link") {
    return (
      <Link href={`/dashboard/prassi/play/${caseRow.id}`} className={`block ${cardClassName}`}>
        {body}
      </Link>
    );
  }

  return <div className={cardClassName}>{body}</div>;
}
