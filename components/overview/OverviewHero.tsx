import { Badge } from "@/app/ui/badge";

type OverviewHeroProps = {
  userName?: string | null;
  completedCount: number;
  casesThisWeek: number;
  focusLabel: string;
  iterMedScore: number | null;
  focusShort: string;
  streakDays: number;
};

export function OverviewHero({
  userName,
  completedCount,
  casesThisWeek,
  focusLabel,
  iterMedScore,
  focusShort,
  streakDays,
}: OverviewHeroProps) {
  const firstName = userName?.split(" ")[0];

  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 shrink-0">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-950">
          Bentornato{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm md:text-base text-zinc-600 max-w-2xl">
          {completedCount > 0 ? (
            <>
              Hai completato{" "}
              <span className="font-semibold text-zinc-900">
                {casesThisWeek} {casesThisWeek === 1 ? "caso" : "casi"}
              </span>{" "}
              questa settimana. Il tuo focus attuale è migliorare la{" "}
              <span className="font-semibold text-zinc-900">{focusLabel}</span>.
            </>
          ) : (
            <>Completa la tua prima simulazione per popolare il profilo competenze.</>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200">
            IterMed Score: {iterMedScore ?? "N/D"}
          </Badge>
          {completedCount > 0 ? <Badge variant="warning">Focus: {focusShort}</Badge> : null}
          <Badge variant="success">
            Streak: {streakDays} {streakDays === 1 ? "giorno" : "giorni"}
          </Badge>
        </div>
      </div>
    </header>
  );
}
