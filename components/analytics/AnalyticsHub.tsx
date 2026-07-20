"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { AnalyticsPageData } from "@/lib/analytics/analytics-types";
import { PersonalProfilePanel } from "@/components/analytics/PersonalProfilePanel";
import { ClinicalPerformanceRegistry } from "@/components/analytics/ClinicalPerformanceRegistry";
import { ScoreTrendChart } from "@/components/statistics/ScoreTrendChart";
import { AiClinicalCoach } from "@/components/statistics/AiClinicalCoach";
import { OVERVIEW_RADAR_METRICS } from "@/lib/constants/overview-radar-metrics";
import { ResultsRadarClient } from "@/app/case/[id]/results/ResultsRadarClient";
import { EconomicBudgetGauge } from "@/app/case/[id]/results/EconomicBudgetGauge";

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

  const radarData = useMemo(
    () =>
      OVERVIEW_RADAR_METRICS.map(({ metric, key }) => ({
        metric,
        score: statistics.overallAverages[key] ?? 0,
        target: 100,
      })),
    [statistics.overallAverages],
  );

  const economyScore = statistics.overallAverages.economicSustainability ?? 0;
  /** Map sustainability score → gauge semantics (higher score = less “spend”). */
  const economyGauge = {
    targetBudget: 100,
    actualSpent: Math.min(150, Math.max(20, Math.round(150 - economyScore))),
    wastedEuro: Math.max(0, Math.round(100 - economyScore)),
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]">
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

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-panel-bg shadow-aequan-panel lg:col-span-7">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-brand-primary">
              Radar competenze aggregate
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Media sulle simulazioni completate vs target formativo (100).
            </p>
          </div>
          <div className="h-80 px-4 py-4">
            {statistics.completedCount === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                Nessun dato disponibile.
              </p>
            ) : (
              <ResultsRadarClient data={radarData} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-brand-secondary/15 bg-brand-secondary/[0.04] shadow-aequan-panel lg:col-span-5">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-brand-primary">
              Indice appropriatezza prescrittiva
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Proxy economico dalla media di sostenibilità (0–100).
            </p>
          </div>
          <div className="px-5 py-4">
            {statistics.completedCount === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nessun dato disponibile.</p>
            ) : (
              <div className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <EconomicBudgetGauge
                  targetBudget={economyGauge.targetBudget}
                  actualSpent={economyGauge.actualSpent}
                  wastedEuro={economyGauge.wastedEuro}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-panel-bg shadow-aequan-panel">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-brand-primary">Trend punteggi</h2>
            <p className="mt-1 text-xs text-slate-500">
              Andamento del punteggio totale nelle ultime sessioni completate.
            </p>
          </div>
          <div className="px-5 py-4">
            <ScoreTrendChart data={statistics.trend} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-panel-bg shadow-aequan-panel">
          <div className="border-b border-border-subtle px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-brand-primary">
              Medie per dimensione
            </h2>
            <p className="mt-1 text-xs text-slate-500">Snapshot su tutti i report completati.</p>
          </div>
          <div className="px-5 py-4">
            {statistics.completedCount === 0 ? (
              <p className="text-sm text-slate-500">Nessun dato disponibile.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {OVERVIEW_RADAR_METRICS.map(({ metric, key }) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-ui-bg/80 px-3 py-2.5"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{metric}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-text-primary">
                      {statistics.overallAverages[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-border bg-panel-bg shadow-aequan-panel">
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-brand-primary">
            Raccomandazioni clinico-legali
          </h2>
          <p className="mt-1 text-xs text-slate-500">
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
