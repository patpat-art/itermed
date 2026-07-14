import Link from "next/link";
import type { CaseDifficulty } from "@prisma/client";
import { Badge } from "@/app/ui/badge";
import { StartCaseButtons } from "@/components/cases/StartCaseButtons";
import { DifficultyBadge } from "@/components/dashboard/DifficultyBadge";
import { displaySpecialtyName } from "@/lib/dashboard-queries";

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
};

export function ClinicalCaseCard({ caseRow, mode = "start" }: ClinicalCaseCardProps) {
  const specialtyLabel = displaySpecialtyName(caseRow);
  const scopeLabel = caseRow.isGlobal ? "Caso globale" : "Caso individuale";

  const cardClassName =
    "rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-zinc-300/90 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all";

  const body = (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-950 leading-snug">{caseRow.title}</p>
          <p className="text-xs text-zinc-500 mt-1">{scopeLabel}</p>
        </div>
        <DifficultyBadge difficulty={caseRow.difficulty} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="default" className="bg-zinc-50">
          {specialtyLabel}
        </Badge>
      </div>
      {mode === "start" ? (
        <div className="mt-auto pt-1">
          <StartCaseButtons caseId={caseRow.id} />
        </div>
      ) : null}
    </div>
  );

  if (mode === "link") {
    return (
      <Link href={`/case/${caseRow.id}`} className={`block ${cardClassName}`}>
        {body}
      </Link>
    );
  }

  return <div className={cardClassName}>{body}</div>;
}
