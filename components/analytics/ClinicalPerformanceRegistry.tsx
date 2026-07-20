"use client";

import type { LeaderboardEntry } from "@/lib/leaderboard/leaderboard-queries";
import { cn } from "@/app/utils/cn";

type ClinicalPerformanceRegistryProps = {
  entries: LeaderboardEntry[];
  currentUserOutsideTop50: LeaderboardEntry | null;
};

function RankCell({ rank }: { rank: number }) {
  return (
    <span className="tabular-nums font-semibold text-slate-700">
      {rank <= 3 ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              rank === 1 && "bg-amber-600/70",
              rank === 2 && "bg-slate-400",
              rank === 3 && "bg-amber-700/50",
            )}
          />
          {rank}
        </span>
      ) : (
        rank
      )}
    </span>
  );
}

export function ClinicalPerformanceRegistry({
  entries,
  currentUserOutsideTop50,
}: ClinicalPerformanceRegistryProps) {
  return (
    <div className="border border-slate-200 bg-white h-full">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
          Registro di Rendimento Clinico
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Classifica comparativa nazionale — top 50 per punteggio medio (/30).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="px-5 py-3 w-16">Pos.</th>
              <th className="px-5 py-3">Identificativo clinico</th>
              <th className="px-5 py-3 text-right">Simulazioni</th>
              <th className="px-5 py-3 text-right">Accuratezza media</th>
              <th className="px-5 py-3 text-right">Punteggio medio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                  Nessun dato disponibile nel registro comparativo.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={`${entry.rank}-${entry.displayName}`}
                  className={cn(
                    "hover:bg-slate-50/60",
                    entry.isCurrentUser && "bg-indigo-50/30",
                  )}
                >
                  <td className="px-5 py-2.5">
                    <RankCell rank={entry.rank} />
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="font-medium text-slate-900">{entry.displayName}</span>
                    {entry.isCurrentUser ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-indigo-700">
                        Tu
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">
                    {entry.sessionCount}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">
                    {entry.averageAccuracyPercent}%
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums font-medium text-slate-900">
                    {entry.averageScore}
                    <span className="text-xs font-normal text-slate-400">/30</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {currentUserOutsideTop50 ? (
        <div className="border-t border-dashed border-slate-200 bg-slate-50/50 px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">
            Posizione personale (fuori top 50)
          </p>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <RankCell rank={currentUserOutsideTop50.rank} />
            <span className="font-medium text-slate-900">{currentUserOutsideTop50.displayName}</span>
            <span className="tabular-nums text-slate-600 ml-auto">
              {currentUserOutsideTop50.sessionCount} sim. ·{" "}
              {currentUserOutsideTop50.averageAccuracyPercent}% ·{" "}
              {currentUserOutsideTop50.averageScore}/30
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
