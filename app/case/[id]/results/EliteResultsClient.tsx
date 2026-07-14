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
  AlertTriangle,
  Brain,
  Euro,
  HeartHandshake,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  XCircle,
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
import { ResultsRadarClient, type RadarDatum } from "./ResultsRadarClient";

type EliteResultsClientProps = {
  totalScore: number;
  radarData: RadarDatum[];
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

function legalShieldConfig(status: LegalProtectionStatus["status"]) {
  switch (status) {
    case "PROTECTED":
      return {
        label: "Protetto",
        icon: ShieldCheck,
        panel: "border-emerald-300/80 bg-gradient-to-br from-emerald-50 to-white",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        accent: "text-emerald-700",
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
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">Conforme</Badge>;
    case "DELAYED":
      return <Badge className="bg-amber-50 text-amber-900 border-amber-200 text-[10px]">In ritardo</Badge>;
    default:
      return <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-[10px]">Omesso</Badge>;
  }
}

const COACH_CARDS: Array<{
  key: keyof CoachingFeedback;
  label: string;
  icon: typeof Brain;
  color: string;
}> = [
  { key: "accuratezza", label: "Accuratezza clinica", icon: Stethoscope, color: "border-sky-200 bg-sky-50/80" },
  { key: "tutelaLegale", label: "Tutela legale", icon: Scale, color: "border-violet-200 bg-violet-50/80" },
  { key: "economicita", label: "Economicità", icon: Euro, color: "border-amber-200 bg-amber-50/80" },
  { key: "empatia", label: "Empatia", icon: HeartHandshake, color: "border-rose-200 bg-rose-50/80" },
];

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

  const budgetChart =
    economicAnalysis ?
      [
        { name: "Budget", value: economicAnalysis.targetBudget, fill: "#22c55e" },
        { name: "Speso", value: economicAnalysis.actualSpent, fill: economicAnalysis.actualSpent > economicAnalysis.targetBudget ? "#ef4444" : "#3b82f6" },
      ]
    : [];

  const overspend =
    economicAnalysis && economicAnalysis.actualSpent > economicAnalysis.targetBudget
      ? economicAnalysis.actualSpent - economicAnalysis.targetBudget
      : 0;

  return (
    <div className="space-y-6">
      {dismissed ? (
        <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-2 text-xs text-amber-950">
          Caso abbandonato: i punteggi sono stati registrati a 0 su tutti gli assi.
        </p>
      ) : null}

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Report élite IterMed</p>
          <h1 className="text-xl font-semibold tracking-tight">Valutazione clinica e medico-legale</h1>
          <p className="text-xs text-zinc-600">
            Analisi multidimensionale con delta Gold Standard, bilancio economico e coaching AI.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-zinc-500">Score complessivo</span>
          <span className="text-3xl font-semibold tracking-tight">{Math.round(totalScore)}</span>
        </div>
      </header>

      {legalProtectionStatus && shield ? (
        <section
          className={cn(
            "rounded-3xl border p-5 md:p-6 shadow-sm",
            shield.panel,
          )}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className={cn("rounded-2xl border p-3 shrink-0", shield.badge)}>
              <ShieldIcon className={cn("h-8 w-8", shield.accent)} />
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">Scudo Legale</h2>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", shield.badge)}>
                  {shield.label}
                </span>
              </div>
              <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-line">
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
                <p className="text-[10px] text-zinc-500">
                  Fonti RAG: {legalSources.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm">Profilo competenze</CardTitle>
            <CardDescription>Radar sui cinque assi core IterMed.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResultsRadarClient data={radarData} />
          </CardContent>
        </Card>

        {economicAnalysis ? (
          <Card className="bg-white/80 border-zinc-200/80">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Euro className="h-4 w-4 text-amber-600" />
                Bilancio economico
              </CardTitle>
              <CardDescription>Budget stimato vs spesa effettiva esami.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetChart} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                    <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2">
                  <p className="text-[10px] text-zinc-500">Budget</p>
                  <p className="text-lg font-semibold text-emerald-800">€{economicAnalysis.targetBudget.toFixed(0)}</p>
                </div>
                <div className={cn("rounded-xl border px-3 py-2", overspend > 0 ? "border-rose-200/80 bg-rose-50/60" : "border-sky-200/80 bg-sky-50/60")}>
                  <p className="text-[10px] text-zinc-500">Speso</p>
                  <p className={cn("text-lg font-semibold", overspend > 0 ? "text-rose-800" : "text-sky-800")}>
                    €{economicAnalysis.actualSpent.toFixed(0)}
                  </p>
                </div>
              </div>
              {overspend > 0 ? (
                <p className="text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Sforamento di €{overspend.toFixed(2)} rispetto al budget target.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </section>

      {clinicalDeltaTable.length > 0 ? (
        <Card className="bg-white/80 border-zinc-200/80 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm">Tabella Delta Clinico</CardTitle>
            <CardDescription>Confronto Gold Standard vs azioni del medico.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-[10px] uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2.5 font-medium">Protocollo</th>
                    <th className="px-4 py-2.5 font-medium">Azione utente</th>
                    <th className="px-4 py-2.5 font-medium">Stato</th>
                    <th className="px-4 py-2.5 font-medium">Motivazione</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicalDeltaTable.map((row, idx) => (
                    <tr key={idx} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-800 align-top">{row.protocolAction}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-zinc-700 align-top",
                          row.status === "MISSED" && "line-through decoration-rose-400 text-rose-700/80",
                        )}
                      >
                        {row.userAction || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">{deltaStatusBadge(row.status)}</td>
                      <td className="px-4 py-3 text-zinc-600 align-top leading-relaxed">{row.penaltyOrBonusReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {economicAnalysis &&
      (economicAnalysis.unnecessaryExpenses.length > 0 || economicAnalysis.missedRequiredExams.length > 0) ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-rose-200/80 bg-rose-50/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-rose-800">
                <XCircle className="h-4 w-4" />
                Spese superflue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {economicAnalysis.unnecessaryExpenses.length === 0 ? (
                <p className="text-xs text-zinc-500">Nessuna spesa superflua rilevata.</p>
              ) : (
                economicAnalysis.unnecessaryExpenses.map((item, i) => (
                  <div key={i} className="rounded-xl border border-rose-200/80 bg-white px-3 py-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-zinc-800">{item.examName}</span>
                      <span className="text-rose-700 font-semibold">€{item.cost.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-1">{item.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200/80 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Esami mancati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {economicAnalysis.missedRequiredExams.length === 0 ? (
                <p className="text-xs text-zinc-500">Nessun esame obbligatorio omesso.</p>
              ) : (
                economicAnalysis.missedRequiredExams.map((item, i) => (
                  <div key={i} className="rounded-xl border border-amber-200/80 bg-white px-3 py-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-zinc-800">{item.examName}</span>
                      <span className="text-amber-800 font-semibold">€{item.cost.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-1">{item.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {coachingFeedback ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-semibold">AI Clinical Coach</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COACH_CARDS.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className={cn("rounded-2xl border p-4 space-y-2", color)}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-zinc-700" />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                  {coachingFeedback[key]}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm">Punti di forza</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            {strengths.length === 0 ? (
              <p className="text-zinc-500">Nessun punto di forza specifico.</p>
            ) : (
              <ul className="space-y-1.5">
                {strengths.map((item, idx) => (
                  <li key={idx} className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm">Aree di miglioramento</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            {weaknesses.length === 0 ? (
              <p className="text-zinc-500">Nessuna criticità specifica.</p>
            ) : (
              <ul className="space-y-1.5">
                {weaknesses.map((item, idx) => (
                  <li key={idx} className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {correctSolution ? (
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm">Gestione esperta di riferimento</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-700 whitespace-pre-line">{correctSolution}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
