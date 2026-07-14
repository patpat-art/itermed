import type { CaseDifficulty } from "@prisma/client";
import { Badge } from "@/app/ui/badge";
import { DIFFICULTY_LABELS } from "@/lib/dashboard-queries";

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
  const key = difficulty as CaseDifficulty;
  const style = DIFFICULTY_STYLES[key] ?? { variant: "default" as const };
  const label = DIFFICULTY_LABELS[key] ?? difficulty;

  return (
    <Badge variant={style.variant} className={[style.className, className].filter(Boolean).join(" ")}>
      {label}
    </Badge>
  );
}
