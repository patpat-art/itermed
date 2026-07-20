import { Badge } from "@/app/ui/badge";
import {
  type CaseDifficulty,
  DIFFICULTY_LABELS,
  isCaseDifficulty,
} from "@/lib/dashboard-case-utils";

const DIFFICULTY_STYLES: Record<
  CaseDifficulty,
  { variant: "success" | "warning" | "default"; className?: string }
> = {
  EASY: { variant: "success" },
  MEDIUM: { variant: "warning" },
  HARD: {
    variant: "default",
    className: "bg-rose-50/90 text-rose-700 border-rose-200/90",
  },
};

type DifficultyBadgeProps = {
  difficulty: string;
  className?: string;
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const key = isCaseDifficulty(difficulty) ? difficulty : null;
  const style = key ? DIFFICULTY_STYLES[key] : { variant: "default" as const };
  const label = key ? DIFFICULTY_LABELS[key] : difficulty || "N/D";

  return (
    <Badge variant={style.variant} className={[style.className, className].filter(Boolean).join(" ")}>
      {label}
    </Badge>
  );
}
