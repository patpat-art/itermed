"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Euro,
  HeartHandshake,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  ClinicalDeltaRow,
  CoachingFeedback,
  EconomicAnalysis,
  LegalProtectionStatus,
} from "@/lib/services/evaluation-report-types";
import { Badge } from "@/app/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";
import { cn } from "@/app/utils/cn";
import { MetricBar } from "./MetricBar";
import { ScoreProgressRing } from "./ScoreProgressRing";
import type { RadarDatum } from "./ResultsRadarClient";

type RadarDatumWithKey = RadarDatum & { key?: string };

type EliteResultsClientProps = {
  totalScore: number;
  radarData: RadarDatumWithKey[];
  dismissed?: boolean;
  strengths?: string[];
  weaknesses?: string[];
  correctSolution?: string;
  legalProtectionStatus?: LegalProtectionStatus;
  clinicalDeltaTable?: ClinicalDeltaRow[];
  economicAnalysis?: EconomicAnalysis;
  coachingFeedback?: CoachingFeedback;
  legalSources?: string[];
};

const PILLARS: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
  fallbackIndex: number;
}> = [
  {
    key: "clinicalAccuracy",
    label: "Accuratezza Clinica",
    icon: Stethoscope,
    fallbackIndex: 0,
  },
  {
    key: "legalComplianceGelliBianco",
    label: "Tutela Medico-Legale",
    icon: Scale,
    fallbackIndex: 1,
  },
  {
    key: "prescribingAppropriateness",
    label: "Appropriatezza Prescrittiva",
    icon: Activity,
    fallbackIndex: 2,
  },
  {
    key: "economicSustainability",
    label: "Sostenibilità Economica",
    icon: Euro,
    fallbackIndex: 3,
  },
  {
    key: "empathy",
    label: "Empatia Clinica",
    icon: HeartHandshake,
    fallbackIndex: 4,
  },
];

const COACH_CARDS: Array<{
  key: keyof CoachingFeedback;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "accuratezza", label: "Accuratezza clinica", icon: Stethoscope },
  { key: "tutelaLegale", label: "Tutela legale", icon: Scale },
  { key: "economicita", label: "Economicità", icon: Euro },
  { key: "empatia", label: "Empatia", icon: HeartHandshake },
];

function legalShieldConfig(status: LegalProtectionStatus["status"]) {
  switch (status) {
    case "PROTECTED":
      return {
        label: "Protetto",
        icon: ShieldCheck,
        panel: "border-[#345884]/15 bg-gradient-to-br from-[#345884]/5 to-white",
        badge: "bg-[#1E324E]/5 text-[#1E324E] border-[#345884]/20",
        accent: "text-[#345884]",
      };
    case "PARTIALLY_EXPOSED":
      return {
        label: "Parzialmente esposto",
        icon: Shield,
        panel: "border-amber-300/80 bg-gradient-to-br from-amber-50 to-white",
        badge: "bg-amber-100 text-amber-900 border-amber-200",
        accent: "text-amber-800",
      };
    default:
      return {
        label: "Altamente esposto",
        icon: ShieldAlert,
        panel: "border-rose-300/80 bg-gradient-to-br from-rose-50 to-white",
        badge: "bg-rose-100 text-rose-800 border-rose-200",
        accent: "text-rose-700",
      };
  }
}

function deltaStatusBadge(status: ClinicalDeltaRow["status"]) {
  switch (status) {
    case "MET":
      return (
        <Badge className="border-slate-200 bg-slate-50 text-[10px] text-[#345884]">
          Conforme
        </Badge>
      );
    case "DELAYED":
      return (
        <Badge className="border-amber-200 bg-amber-50 text-[10px] text-amber-900">
          In ritardo
        </Badge>
      );
    default:
      return (
        <Badge className="border-rose-200 bg-rose-50 text-[10px] text-rose-800">Omesso</Badge>
      );
  }
}

function resolvePillarScore(radarData: RadarDatumWithKey[], pillar: (typeof PILLARS)[number]) {
  const byKey = radarData.find((d) => d.key === pillar.key);
  if (byKey) return byKey.score;
  return radarData[pillar.fallbackIndex]?.score ?? 0;
}

export function EliteResultsClient({
  totalScore,
  radarData,
  dismissed,
  strengths = [],
  weaknesses = [],
  correctSolution,
  legalProtectionStatus,
  clinicalDeltaTable = [],
  economicAnalysis,
  coachingFeedback,
  legalSources = [],
}: EliteResultsClientProps) {
  const shield = legalProtectionStatus
    ? legalShieldConfig(legalProtectionStatus.status)
    : null;
  const ShieldIcon = shield?.icon ?? Shield;

  const budgetChart = economicAnalysis
    ? [
        { name: "Budget", value: economicAnalysis.targetBudget, fill: "#345884" },
        {
          name: "Speso",
          value: economicAnalysis.actualSpent,
          fill:
            economicAnalysis.actualSpent > economicAnalysis.targetBudget
              ? "#C0392B"
              : "#1E324E",
        },
      ]
    : [];

  const overspend =
    economicAnalysis && economicAnalysis.actualSpent > economicAnalysis.targetBudget
      ? economicAnalysis.actualSpent - economicAnalysis.targetBudget
      : 0;

  const budgetRespected = economicAnalysis
    ? economicAnalysis.actualSpent <= economicAnalysis.targetBudget
    : true;

  return (
    <div className="space-y-6 font-[family-name:var(--font-inter)]">
      {/* ── A. Banner abbandono ── */}
      {dismissed ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-2 text-xs text-amber-950">
          Caso abbandonato: i punteggi sono stati registrati a 0 su tutti gli assi.
        </p>
      ) : null}

      {/* ── B. Header ── */}
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#345884]">
            REPORT DI VALUTAZIONE SCIENTIFICA · AEQUAN
          </p>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[#1E324E]">
            Valutazione clinica e medico-legale
          </h1>
          <p className="max-w-xl text-xs leading-relaxed text-slate-500">
            Analisi multidimensionale con delta Gold Standard, bilancio economico e coaching AI.
          </p>
        </div>
        <div className="flex flex-col items-start rounded-xl border border-[#345884]/10 bg-[#345884]/5 px-4 py-3 md:items-end">
          <span className="text-[11px] text-slate-500">Score complessivo</span>
          <span className="font-display text-3xl font-semibold tracking-tight text-[#1E324E]">
            {Math.round(totalScore)}
          </span>
        </div>
      </header>

      {/* ── C. Scudo Legale ── */}
      {legalProtectionStatus && shield ? (
        <section
          className={cn("rounded-3xl border p-5 shadow-sm md:p-6", shield.panel)}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className={cn("shrink-0 rounded-2xl border p-3", shield.badge)}>
              <ShieldIcon className={cn("h-8 w-8", shield.accent)} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-sm font-semibold text-[#1E324E]">
                  Scudo Legale
                </h2>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    shield.badge,
                  )}
                >
                  {shield.label}
                </span>
              </div>
              <p className="rounded-xl border border-slate-100 border-l-4 border-l-[#1E324E] bg-white/80 p-4 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {legalProtectionStatus.justification}
              </p>
              {legalProtectionStatus.referenceDocuments.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {legalProtectionStatus.referenceDocuments.map((doc) => (
                    <Badge key={doc} variant="default" className="text-[10px]">
                      {doc}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {legalSources.length > 0 ? (
                <p className="text-[10px] text-slate-500">
                  Fonti RAG: {legalSources.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════
          D. GRID — Plancia 5 pilastri + Bilancio
          ═══════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* D1 — Plancia dei 5 Pilastri */}
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm lg:col-span-7 xl:col-span-8">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm font-bold tracking-tight text-[#1E324E]">
              Plancia dei 5 Pilastri
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Indicatori core AEQUAN — pari dignità visiva su tutti gli assi di valutazione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                const score = resolvePillarScore(radarData, pillar);
                return (
                  <div
                    key={pillar.key}
                    className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/40 px-2 py-4"
                  >
                    <ScoreProgressRing
                      compact
                      size={100}
                      score={score}
                      label={pillar.label}
                      icon={<Icon className="h-4 w-4" />}
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              {PILLARS.map((pillar) => (
                <MetricBar
                  key={`bar-${pillar.key}`}
                  label={pillar.label}
                  score={resolvePillarScore(radarData, pillar)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* D2 — Bilancio Economico */}
        <Card
          className={cn(
            "rounded-2xl shadow-sm lg:col-span-5 xl:col-span-4",
            "border border-[#345884]/10 bg-[#345884]/5",
          )}
        >
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-sm font-bold tracking-tight text-[#1E324E]">
              <Euro className="h-4 w-4 text-[#345884]" />
              Bilancio economico SSN
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Documento di appropriatezza: budget assegnato vs spesa effettuata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {economicAnalysis ? (
              <>
                <div className="h-40 rounded-xl border border-white/80 bg-white/70 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetChart} barSize={48}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E2E8F0"
                        vertical={false}
                      />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                      <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white/90 px-3.5 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Budget Assegnato SSN
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-lg font-semibold",
                        budgetRespected ? "text-[#345884]" : "text-[#1E324E]",
                      )}
                    >
                      €{economicAnalysis.targetBudget.toFixed(0)}
                    </p>
                    {budgetRespected ? (
                      <p className="mt-1 text-[10px] font-medium text-emerald-700">
                        Budget rispettato
                      </p>
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border px-3.5 py-3",
                      overspend > 0
                        ? "border-rose-200/80 bg-rose-50/70"
                        : "border-white bg-white/90",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Spesa Effettuata
                      </p>
                      {overspend > 0 ? (
                        <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-800">
                          Sforamento Budget
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "mt-1 font-mono text-lg font-semibold",
                        overspend > 0 ? "text-[#C0392B]" : "text-[#1E324E]",
                      )}
                    >
                      €{economicAnalysis.actualSpent.toFixed(0)}
                    </p>
                    {overspend > 0 ? (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-rose-700">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        +€{overspend.toFixed(2)} oltre target
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] font-medium text-slate-500">
                        Entro soglia di appropriatezza
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-xs text-slate-500">
                Bilancio economico non disponibile per questa sessione.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── E. Delta Clinico ── */}
      {clinicalDeltaTable.length > 0 ? (
        <Card className="overflow-hidden rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-sm font-bold text-[#1E324E]">
              Tabella Delta Clinico
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Confronto Gold Standard vs azioni del medico.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Protocollo</th>
                    <th className="px-4 py-2.5 font-medium">Azione utente</th>
                    <th className="px-4 py-2.5 font-medium">Stato</th>
                    <th className="px-4 py-2.5 font-medium">Motivazione</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicalDeltaTable.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 align-top font-medium text-slate-800">
                        {row.protocolAction}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 align-top text-slate-600",
                          row.status === "MISSED" &&
                            "text-rose-700/80 line-through decoration-rose-400",
                        )}
                      >
                        {row.userAction || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">{deltaStatusBadge(row.status)}</td>
                      <td className="px-4 py-3 align-top leading-relaxed text-slate-600">
                        {row.penaltyOrBonusReason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ── F. Spese / Esami mancati ── */}
      {economicAnalysis &&
      (economicAnalysis.unnecessaryExpenses.length > 0 ||
        economicAnalysis.missedRequiredExams.length > 0) ? (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="rounded-2xl border-rose-200/80 bg-rose-50/40 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-rose-800">
                <XCircle className="h-4 w-4" />
                Spese superflue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {economicAnalysis.unnecessaryExpenses.length === 0 ? (
                <p className="text-xs text-slate-500">Nessuna spesa superflua rilevata.</p>
              ) : (
                economicAnalysis.unnecessaryExpenses.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-rose-200/80 bg-white px-3 py-2"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-slate-800">{item.examName}</span>
                      <span className="font-semibold text-rose-700">
                        €{item.cost.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{item.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-amber-200/80 bg-amber-50/40 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Esami mancati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {economicAnalysis.missedRequiredExams.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Nessun esame obbligatorio omesso.
                </p>
              ) : (
                economicAnalysis.missedRequiredExams.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-amber-200/80 bg-white px-3 py-2"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-slate-800">{item.examName}</span>
                      <span className="font-semibold text-amber-800">
                        €{item.cost.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{item.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════════
          G. AI Clinical Coach
          ═══════════════════════════════════════════════════ */}
      {coachingFeedback ? (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#345884]" />
            <h2 className="font-display text-sm font-bold text-[#1E324E]">
              AI Clinical Coach
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COACH_CARDS.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="space-y-2 rounded-2xl border border-slate-100 border-l-4 border-l-[#1E324E] bg-slate-50/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#345884]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">
                  {coachingFeedback[key]}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── H. Forza / Debolezza ── */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-sm font-bold text-[#1E324E]">
              Punti di forza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {strengths.length === 0 ? (
              <p className="text-slate-500">Nessun punto di forza specifico.</p>
            ) : (
              <ul className="space-y-1.5">
                {strengths.map((item, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-1.5 text-slate-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-sm font-bold text-[#1E324E]">
              Aree di miglioramento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            {weaknesses.length === 0 ? (
              <p className="text-slate-500">Nessuna criticità specifica.</p>
            ) : (
              <ul className="space-y-1.5">
                {weaknesses.map((item, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-1.5 text-slate-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── I. Gestione esperta ── */}
      {correctSolution ? (
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-sm font-bold text-[#1E324E]">
              Gestione esperta di riferimento
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed whitespace-pre-line text-slate-600">
            {correctSolution}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
