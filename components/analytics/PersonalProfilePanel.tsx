"use client";

import { useState, useTransition } from "react";
import type { LeaderboardNameType } from "@prisma/client";
import type {
  LeaderboardPreferences,
  PersonalPerformanceMetrics,
} from "@/lib/leaderboard/leaderboard-queries";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";

type PersonalProfilePanelProps = {
  metrics: PersonalPerformanceMetrics;
  preferences: LeaderboardPreferences;
  onUpdated: () => void;
};

const NAME_OPTIONS: { value: LeaderboardNameType; label: string }[] = [
  { value: "REAL_NAME", label: "Nome reale" },
  { value: "NICKNAME", label: "Nickname" },
  { value: "ANONYMOUS", label: "Anonimo" },
];

const VISIBILITY_OPTIONS = [
  { value: "visible" as const, label: "Visibile" },
  { value: "hidden" as const, label: "Nascosto" },
];

export function PersonalProfilePanel({
  metrics,
  preferences: initialPreferences,
  onUpdated,
}: PersonalProfilePanelProps) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [nickname, setNickname] = useState(initialPreferences.nickname ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function patchPreferences(
    patch: Partial<LeaderboardPreferences & { nickname: string | null }>,
  ) {
    setError(null);
    const res = await fetch("/api/leaderboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setError("Impossibile aggiornare le preferenze.");
      return;
    }
    const data = await res.json();
    setPrefs(data.preferences);
    onUpdated();
  }

  function selectNameType(value: LeaderboardNameType) {
    setPrefs((p) => ({ ...p, leaderboardNameType: value }));
    startTransition(() => {
      void patchPreferences({
        leaderboardNameType: value,
        nickname: value === "NICKNAME" ? nickname.trim() || null : prefs.nickname,
      });
    });
  }

  function setVisibility(value: "visible" | "hidden") {
    const next = value === "visible";
    setPrefs((p) => ({ ...p, leaderboardOptIn: next }));
    startTransition(() => {
      void patchPreferences({ leaderboardOptIn: next });
    });
  }

  function saveNickname() {
    startTransition(() => {
      void patchPreferences({ nickname: nickname.trim() || null });
    });
  }

  const percentileText =
    prefs.leaderboardOptIn && metrics.percentileTop != null
      ? `Ti posizioni nel top ${metrics.percentileTop}% dei medici esaminati`
      : "Registrati in classifica per calcolare il percentile nazionale";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Il tuo Profilo Performance</CardTitle>
        <CardDescription>
          Metriche personali aggregate da simulazioni cliniche completate.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-clinical border border-zinc-200/60 bg-clinical-bg px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Punteggio medio
            </p>
            <p className="mt-1 text-2xl font-semibold text-clinical-navy font-tabular">
              {metrics.averageScore != null ? metrics.averageScore : "—"}
              {metrics.averageScore != null ? (
                <span className="text-sm font-normal text-slate-400"> /30</span>
              ) : null}
            </p>
          </div>
          <div className="rounded-clinical border border-zinc-200/60 bg-clinical-bg px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Simulazioni
            </p>
            <p className="mt-1 text-2xl font-semibold text-clinical-navy font-tabular">
              {metrics.completedCount}
            </p>
          </div>
        </div>

        <div className="rounded-clinical border border-sky-100 bg-sky-50/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-clinical-blue/80">
            Percentile nazionale
          </p>
          <p className="mt-1 text-sm font-medium text-clinical-navy leading-snug">{percentileText}</p>
        </div>

        {metrics.clinicalResolutionRate != null ? (
          <div className="text-xs text-slate-600 border-t border-zinc-200/60 pt-3 space-y-1">
            <p>
              Tasso di risoluzione clinica:{" "}
              <span className="font-semibold text-clinical-navy font-tabular">
                {metrics.clinicalResolutionRate}%
              </span>
            </p>
            {metrics.averageResolutionMinutes != null ? (
              <p>
                Tempo medio di risoluzione:{" "}
                <span className="font-semibold text-clinical-navy font-tabular">
                  {metrics.averageResolutionMinutes} min
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="mt-auto space-y-3">
        <div className="space-y-2 w-full">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Visibilità in registro
          </p>
          <SegmentedControl
            aria-label="Visibilità profilo in registro"
            options={VISIBILITY_OPTIONS}
            value={prefs.leaderboardOptIn ? "visible" : "hidden"}
            onChange={setVisibility}
            disabled={isPending}
          />
        </div>

        {prefs.leaderboardOptIn ? (
          <div className="space-y-2 w-full">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Identità in classifica
            </p>
            <SegmentedControl
              aria-label="Tipo di identità in classifica"
              options={NAME_OPTIONS}
              value={prefs.leaderboardNameType}
              onChange={selectNameType}
              disabled={isPending}
            />

            {prefs.leaderboardNameType === "NICKNAME" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={40}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nickname"
                  className="flex-1 rounded-clinical border border-zinc-200/60 px-2.5 py-1.5 text-xs outline-none focus:border-clinical-blue/60"
                />
                <button
                  type="button"
                  onClick={saveNickname}
                  disabled={isPending}
                  className="rounded-clinical border border-clinical-navy bg-clinical-navy px-3 py-1.5 text-[11px] font-medium text-white"
                >
                  Salva
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="text-[11px] text-clinical-rose">{error}</p> : null}
      </CardFooter>
    </Card>
  );
}
