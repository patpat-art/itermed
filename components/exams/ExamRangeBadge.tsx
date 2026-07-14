import { Badge } from "@/app/ui/badge";
import { isValueInNormalRange } from "@/lib/exams/exam-range-utils";

type ExamRangeBadgeProps = {
  value: string;
  min: number | null;
  max: number | null;
};

export function ExamRangeBadge({ value, min, max }: ExamRangeBadgeProps) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const numeric = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(numeric)) return null;
  if (min == null && max == null) return null;

  const inRange = isValueInNormalRange(numeric, min, max);

  return inRange ? (
    <Badge variant="success" className="text-[10px]">
      Fisiologico
    </Badge>
  ) : (
    <Badge
      variant="default"
      className="text-[10px] bg-rose-50 text-rose-700 border-rose-200"
    >
      Patologico — Valore fuori range
    </Badge>
  );
}
