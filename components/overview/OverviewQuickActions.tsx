import Link from "next/link";
import { Play, Target, Calendar } from "lucide-react";

type OverviewQuickActionsProps = {
  focusShort: string;
  casesThisWeek: number;
};

export function OverviewQuickActions({ focusShort, casesThisWeek }: OverviewQuickActionsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-[#2F4156] dark:text-slate-100">Simulatore</p>
        <p className="mt-1 text-xs text-slate-500">
          Avvia una simulazione in un click, o continua il percorso.
        </p>
        <Link href="/dashboard/prassi" className="mt-4 block">
          <div className="rounded-xl border border-slate-200 bg-[#1E324E] px-5 py-4 text-white shadow-sm transition-colors hover:bg-[#2A486D]">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-display text-sm font-semibold tracking-tight">Prassi Clinica</p>
                <p className="text-xs text-white/70">
                  Libreria casi ed esercitazioni — avvia una simulazione.
                </p>
              </div>
              <Play className="h-5 w-5 shrink-0" />
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Target className="h-4 w-4 shrink-0" />
          <span>Focus</span>
        </div>
        <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-slate-100">{focusShort}</p>
        <p className="mt-1 text-xs text-slate-500">Dimensione con media più bassa</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Settimana</span>
        </div>
        <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-slate-100">
          {casesThisWeek} {casesThisWeek === 1 ? "caso" : "casi"}
        </p>
        <p className="mt-1 text-xs text-slate-500">Attività negli ultimi 7 giorni</p>
      </div>
    </div>
  );
}
