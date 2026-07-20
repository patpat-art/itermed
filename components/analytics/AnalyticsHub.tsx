"use client";

import { useCallback, useState, useTransition } from "react";
import type { AnalyticsPageData } from "@/lib/analytics/analytics-types";
import { PersonalProfilePanel } from "@/components/analytics/PersonalProfilePanel";
import { ClinicalPerformanceRegistry } from "@/components/analytics/ClinicalPerformanceRegistry";
import { ScoreTrendChart } from "@/components/statistics/ScoreTrendChart";
import { AiClinicalCoach } from "@/components/statistics/AiClinicalCoach";
import { OVERVIEW_RADAR_METRICS } from "@/lib/constants/overview-radar-metrics";

type AnalyticsHubProps = {
  initialData: AnalyticsPageData;
};

export function AnalyticsHub({ initialData }: AnalyticsHubProps) {
  const [data, setData] = useState(initialData);
  const [, startTransition] = useTransition();

  const refreshLeaderboard = useCallback(() => {
    startTransition(async () => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return;
      const leaderboard = await res.json();
      setData((prev) => ({ ...prev, leaderboard }));
    });
  }, []);

  const { leaderboard, statistics } = data;
  const currentEntry = leaderboard.currentUser.entry;
  const isOutsideTop50 =
    currentEntry != null &&
    currentEntry.rank > 50 &&
    !leaderboard.top50.some((e) => e.isCurrentUser);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)] gap-5 items-stretch">
        <PersonalProfilePanel
          metrics={leaderboard.currentUser.metrics}
          preferences={leaderboard.currentUser.preferences}
          onUpdated={refreshLeaderboard}
        />

        <ClinicalPerformanceRegistry
          entries={leaderboard.top50}
          currentUserOutsideTop50={isOutsideTop50 ? currentEntry : null}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Trend punteggi</h2>
            <p className="text-xs text-slate-500 mt-1">
              Andamento del punteggio totale (/30) nelle ultime sessioni completate.
            </p>
          </div>
          <div className="px-5 py-4">
            <ScoreTrendChart data={statistics.trend} />
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Medie per dimensione</h2>
            <p className="text-xs text-slate-500 mt-1">Snapshot su tutti i report completati.</p>
          </div>
          <div className="px-5 py-4">
            {statistics.completedCount === 0 ? (
              <p className="text-sm text-slate-500">Nessun dato disponibile.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {OVERVIEW_RADAR_METRICS.map(({ metric, key }) => (
                  <div key={key} className="border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wide">{metric}</p>
                    <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">
                      {statistics.overallAverages[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Raccomandazioni clinico-legali</h2>
          <p className="text-xs text-slate-500 mt-1">
            Aree prioritarie di miglioramento basate sulle tue performance aggregate.
          </p>
        </div>
        <div className="px-5 py-4">
          <AiClinicalCoach insights={statistics.coachInsights} />
        </div>
      </div>
    </div>
  );
}
