import { ClinicalCaseCard, type ClinicalCaseRow } from "@/components/dashboard/ClinicalCaseCard";

type ClinicalCaseGridProps = {
  cases: ClinicalCaseRow[];
  mode?: "start" | "link";
  emptyMessage?: string;
};

export function ClinicalCaseGrid({ cases, mode = "start", emptyMessage }: ClinicalCaseGridProps) {
  if (cases.length === 0) {
    return (
      <p className="text-xs text-zinc-500 py-4 text-center col-span-full">
        {emptyMessage ?? "Nessun caso con i filtri attivi."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cases.map((caseRow) => (
        <ClinicalCaseCard key={caseRow.id} caseRow={caseRow} mode={mode} />
      ))}
    </div>
  );
}
