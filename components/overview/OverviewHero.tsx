import type { ElementType } from "react";
import Link from "next/link";
import { ArrowRight, Award, Flame, Target } from "lucide-react";

type OverviewHeroProps = {
  userName?: string | null;
  completedCount: number;
  casesThisWeek: number;
  focusLabel: string;
  iterMedScore: number | null;
  focusShort: string;
  streakDays: number;
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[7.5rem] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  );
}

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
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
              {greeting}
              {firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="mt-2 text-base leading-relaxed text-slate-600">
              {completedCount > 0 ? (
                <>
                  Questa settimana: {casesThisWeek}{" "}
                  {casesThisWeek === 1 ? "caso" : "casi"}. Focus consigliato:{" "}
                  <span className="font-medium text-slate-800">{focusLabel}</span>.
                </>
              ) : (
                <>Inizia dalla Prassi Clinica: scegli un caso e avvia la simulazione.</>
              )}
            </p>
          </div>
          <Link
            href="/dashboard/prassi"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E324E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A486D]"
          >
            {completedCount > 0 ? "Continua a esercitarti" : "Inizia una simulazione"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatCard
            icon={Award}
            label="Score"
            value={iterMedScore != null ? String(iterMedScore) : "—"}
          />
          <StatCard icon={Target} label="Focus" value={completedCount > 0 ? focusShort : "—"} />
          <StatCard icon={Flame} label="Streak" value={`${streakDays}g`} />
        </div>
      </div>
    </header>
  );
}
