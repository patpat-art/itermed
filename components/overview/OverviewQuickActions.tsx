import Link from "next/link";
import { ArrowRight, Calendar, Target } from "lucide-react";

type OverviewQuickActionsProps = {
  focusShort: string;
  casesThisWeek: number;
};

const WEEKLY_GOAL = 5;

export function OverviewQuickActions({ focusShort, casesThisWeek }: OverviewQuickActionsProps) {
  const weekProgress = Math.min(100, Math.round((casesThisWeek / WEEKLY_GOAL) * 100));

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/prassi"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#1E324E] px-5 py-5 text-white shadow-sm transition hover:bg-[#2A486D]"
      >
        <div>
          <p className="text-base font-semibold">Prassi Clinica</p>
          <p className="mt-1 text-sm text-white/75">Apri la libreria casi e avvia una sessione</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition group-hover:scale-105">
          <ArrowRight className="h-5 w-5" />
        </span>
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Da migliorare</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{focusShort}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-500">Questa settimana</p>
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {casesThisWeek}/{WEEKLY_GOAL}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#345884] transition-all"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
