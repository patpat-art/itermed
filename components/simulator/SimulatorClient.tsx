"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  Activity,
  ArrowLeft,
  Clock,
  EuroIcon,
  HeartPulse,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../app/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../app/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../app/ui/card";
import { Button } from "../../app/ui/button";
import { Textarea } from "../../app/ui/textarea";
import { Badge } from "../../app/ui/badge";
import { PhysicalExamTab } from "./PhysicalExamTab";

type Exam = {
  id: string;
  name: string;
  cost: number;
  timeMinutes: number;
};

const AVAILABLE_EXAMS: Exam[] = [
  { id: "cbc", name: "Emocromo completo", cost: 15, timeMinutes: 20 },
  { id: "ecg", name: "ECG 12 derivazioni", cost: 60, timeMinutes: 15 },
  { id: "ct-chest", name: "TAC Torace con mezzo di contrasto", cost: 180, timeMinutes: 90 },
  { id: "cxr", name: "Rx Torace", cost: 35, timeMinutes: 25 },
  { id: "abg", name: "Emogasanalisi arteriosa", cost: 25, timeMinutes: 10 },
];

type InitialCaseData = {
  id: string;
  title: string;
  description: string;
  specialty: string | null;
  difficulty: string;
  estimatedDurationMinutes: number | null;
  patientPrompt: string;
  correctSolution?: string | null;
  demographics?: {
    age?: number | string | null;
    sex?: string | null;
    context?: string | null;
  };
};

type SimulatorClientProps = {
  initialCaseData: InitialCaseData;
  isVariant?: boolean;
  sessionId?: string;
  /** Se false (casi demo senza DB), l’abbandono non crea SessionReport e torna solo al dashboard. */
  persistReports?: boolean;
};

function SimulatorNavBar({
  dismissCase,
}: {
  dismissCase?: { loading: boolean; onClick: () => void };
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex h-12 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-md shadow-sm">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        Dashboard
      </Link>
      {dismissCase ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs border-rose-200/80 text-rose-800 hover:bg-rose-50"
          disabled={dismissCase.loading}
          onClick={dismissCase.onClick}
          title="Dismiss case — all scores recorded as 0"
        >
          {dismissCase.loading ? "Uscita…" : "Abbandona caso"}
        </Button>
      ) : null}
    </header>
  );
}

export function SimulatorClient({
  initialCaseData,
  isVariant,
  sessionId,
  persistReports = true,
}: SimulatorClientProps) {
  const router = useRouter();

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "exam" | "tests">("history");
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [reportText, setReportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPatientChartOpen, setIsPatientChartOpen] = useState(false);

  const [examFindings, setExamFindings] = useState<
    Record<string, { id: string; label: string; finding: string; numericValue: number | null }>
  >({});

  type GameStatus =
    | "playing"
    | "checking_diagnosis"
    | "wrong_diagnosis"
    | "success"
    | "complication"
    | "showing_report";

  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [enableAiSurprises, setEnableAiSurprises] = useState(false);
  const [forceAiSurprise, setForceAiSurprise] = useState(false);
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [expectedConditionText, setExpectedConditionText] = useState<string | null>(null);
  const [debugTargetCondition, setDebugTargetCondition] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<
    "clinical" | "legal" | "prescribing" | "empathy" | "economy"
  >("clinical");

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<null | {
    scores: { clinical: number; legal: number; exams: number; empathy: number; economy: number };
    feedback: {
      clinicalNote: string;
      legalComplianceNote: string;
      prescribingNote: string;
      empathyNote: string;
      economyNote: string;
      strengths: string[];
      weaknesses: string[];
      correctSolution: string;
    };
    evidence?: { legalSources: string[]; protocolSources: string[] };
    totalScore?: number;
  }>(null);

  const [effectiveSessionId, setEffectiveSessionId] = useState<string | undefined>(sessionId);
  const [isStartingEmergency, setIsStartingEmergency] = useState(false);
  const [dismissLoading, setDismissLoading] = useState(false);

  const ensureSessionId = async (): Promise<string | null> => {
    if (effectiveSessionId) return effectiveSessionId;
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: initialCaseData.id,
          mode: "original",
        }),
      });
      const data = await res.json().catch(() => null);
      const newSessionId = data?.sessionId as string | undefined;
      if (newSessionId) {
        setEffectiveSessionId(newSessionId);
        return newSessionId;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDismissCase = async () => {
    const confirmed = window.confirm(
      "Abbandonare il caso (Dismiss case)? Verrà registrato un punteggio di 0 su tutti gli assi di valutazione.",
    );
    if (!confirmed) return;

    if (!persistReports) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setDismissLoading(true);
    try {
      const liveId = (await ensureSessionId()) ?? undefined;
      const res = await fetch("/api/session/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: initialCaseData.id,
          ...(liveId ? { liveSessionId: liveId } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as { sessionId?: string } | null;
      if (!res.ok || !data?.sessionId) {
        throw new Error("dismiss failed");
      }
      router.push(`/case/${initialCaseData.id}/results?sessionId=${data.sessionId}`);
      router.refresh();
    } catch {
      setDismissLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveSessionId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: initialCaseData.id,
            mode: "original",
          }),
        });
        const data = await res.json().catch(() => null);
        const newSessionId = data?.sessionId as string | undefined;
        if (!cancelled && newSessionId) {
          setEffectiveSessionId(newSessionId);
          router.replace(`/case/${initialCaseData.id}?sessionId=${newSessionId}`);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveSessionId, initialCaseData.id, router]);

  useEffect(() => {
    if (!effectiveSessionId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/session/state?sessionId=${effectiveSessionId}`);
      const data = await res.json().catch(() => null);
      if (!cancelled && data?.targetCondition) {
        setDebugTargetCondition(String(data.targetCondition));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveSessionId]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
  } = useChat({
    api: "/api/chat",
    streamProtocol: "data",
    body: {
      casePrompt: initialCaseData.patientPrompt,
      caseId: initialCaseData.id,
      sessionId: effectiveSessionId,
    },
  });

  const selectedExams = useMemo(
    () => AVAILABLE_EXAMS.filter((exam) => selectedExamIds.includes(exam.id)),
    [selectedExamIds],
  );

  const totalCost = selectedExams.reduce((sum, exam) => sum + exam.cost, 0);
  const totalMinutes = selectedExams.reduce((sum, exam) => sum + exam.timeMinutes, 0);

  const demo = initialCaseData.demographics ?? {};
  const ageValue = demo.age ?? 58;
  const sexValue = (demo.sex === "F" || demo.sex === "M") ? demo.sex : "M";
  const contextValue = demo.context ?? initialCaseData.specialty ?? "Specialità non specificata";

  const patient = {
    age: ageValue,
    sex: (sexValue === "F" ? "F" : "M") as "M" | "F",
    mainComplaint: initialCaseData.description,
    context: contextValue,
    id: `CASE-${String(initialCaseData.id ?? "").slice(0, 6).toUpperCase() || "DEMO"}`,
  };

  const handleExamFinding = (payload: {
    id: string;
    label: string;
    result: { finding: string; numericValue: number | null };
  }) => {
    setExamFindings((prev) => ({
      ...prev,
      [payload.id]: {
        id: payload.id,
        label: payload.label,
        finding: payload.result.finding,
        numericValue: payload.result.numericValue,
      },
    }));
  };

  const toggleExam = (examId: string) => {
    setSelectedExamIds((current) =>
      current.includes(examId)
        ? current.filter((id) => id !== examId)
        : [...current, examId],
    );
  };

  const handleConcludeCase = async () => {
    if (!initialCaseData.id) return;
    if (!reportText.trim()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        caseId: String(initialCaseData.id),
        chatHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        exams: selectedExams,
        reportText,
        caseContext: initialCaseData.patientPrompt,
      };

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Errore nella valutazione del caso.");
      }

      const data = await res.json();
      router.push(`/case/${initialCaseData.id}/results?sessionId=${data.sessionId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportMock = {
    overview:
      "Esito complessivo: gestione solida, buona comunicazione. Migliorabile l’appropriatezza di alcuni accertamenti.",
    history:
      "Anamnesi: dolore toracico oppressivo, insorgenza 2h, irradiazione, fattori di rischio e sintomi associati raccolti.",
    diagnostics:
      "Diagnostica: ECG, troponina, Rx torace. Valutare serialità markers e stratificazione rischio.",
    therapy:
      "Terapia: stabilizzazione, analgesia, antiaggregazione/anticoagulazione secondo contesto, monitoraggio e rivalutazione.",
    timeline:
      "Timeline: T0 triage → T+10 anamnesi → T+25 esame obiettivo → T+40 esami → T+90 rivalutazione → conclusione.",
  } as const;

  const confirmDiagnosis = () => {
    if (!finalDiagnosis.trim()) return;
    setGameStatus("checking_diagnosis");

    window.setTimeout(async () => {
      try {
        const res = await fetch("/api/session/check-diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: initialCaseData.id,
            sessionId: effectiveSessionId,
            diagnosisText: finalDiagnosis,
          }),
        });

        const verdict = (await res.json().catch(() => null)) as
          | { isCorrect: boolean; expectedCondition?: string }
          | null;

        const isCorrect = Boolean(verdict && verdict.isCorrect);
        setExpectedConditionText(
          verdict?.expectedCondition ? String(verdict.expectedCondition) : null,
        );

        if (isCorrect) {
          // Debug / QA: forza sempre l'imprevisto se richiesto
          if (forceAiSurprise) {
            setGameStatus("complication");
            return;
          }

          // Imprevisto: 20% se toggle attivo
          if (enableAiSurprises && Math.random() < 0.2) {
            setGameStatus("complication");
            return;
          }

          setGameStatus("success");

          if (effectiveSessionId) {
            await fetch("/api/session/outcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: effectiveSessionId,
                caseId: initialCaseData.id,
                basePatientPrompt: initialCaseData.patientPrompt,
                outcome: "success",
              }),
            });
            router.replace(`/case/${initialCaseData.id}?sessionId=${effectiveSessionId}`);
          }
          return;
        }

        setGameStatus("wrong_diagnosis");
        if (effectiveSessionId) {
          await fetch("/api/session/outcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: effectiveSessionId,
              caseId: initialCaseData.id,
              basePatientPrompt: initialCaseData.patientPrompt,
              outcome: "wrong_diagnosis",
            }),
          });
          router.replace(`/case/${initialCaseData.id}?sessionId=${effectiveSessionId}`);
        }
      } catch {
        // fallback safe: don't block the flow; treat as success but without surprise
        setGameStatus("success");
      }
    }, 2000);
  };

  if (gameStatus === "showing_report") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-stretch justify-center px-4 pt-16 pb-10">
        <SimulatorNavBar />
        <div className="w-full max-w-6xl flex flex-col gap-6">
          <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Report finale</CardTitle>
              <CardDescription>
                Naviga tra le sezioni del report per rivedere anamnesi, diagnostica e terapia.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(
                  [
                    { id: "clinical", label: "Accuratezza clinica" },
                    { id: "legal", label: "Legal compliance" },
                    { id: "prescribing", label: "Appropriatezza prescrittiva" },
                    { id: "empathy", label: "Empatia" },
                    { id: "economy", label: "Sostenibilità economica" },
                  ] as const
                ).map((t) => {
                  const isActive = t.id === activeReportTab;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveReportTab(t.id)}
                      className={
                        "relative -mb-px flex items-center gap-2 rounded-t-2xl border px-4 py-2 text-[11px] font-medium transition-colors whitespace-nowrap " +
                        (isActive
                          ? "bg-white border-zinc-200 text-zinc-950"
                          : "bg-zinc-100/80 border-zinc-200/80 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100")
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-b-2xl rounded-tr-2xl border border-zinc-200/80 bg-white p-5 text-sm text-zinc-800 leading-relaxed space-y-3">
                {reportLoading && (
                  <div className="text-sm text-zinc-700">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-spin text-sky-600" />
                      Generazione report in corso...
                    </span>
                  </div>
                )}
                {!reportLoading && reportError && (
                  <div className="text-sm text-rose-700">{reportError}</div>
                )}
                {!reportLoading && reportData && (
                  <>
                    {activeReportTab === "clinical" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.clinical)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.clinicalNote}</p>
                      </>
                    )}
                    {activeReportTab === "legal" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.legal)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.legalComplianceNote}</p>
                        {reportData.evidence?.legalSources?.length ? (
                          <div className="text-xs text-zinc-600">
                            <span className="font-medium">Fonti (tag: legale):</span>{" "}
                            {reportData.evidence.legalSources.join(" · ")}
                          </div>
                        ) : null}
                      </>
                    )}
                    {activeReportTab === "prescribing" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.exams)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.prescribingNote}</p>
                        {reportData.evidence?.protocolSources?.length ? (
                          <div className="text-xs text-zinc-600">
                            <span className="font-medium">Fonti (tag: protocolli):</span>{" "}
                            {reportData.evidence.protocolSources.join(" · ")}
                          </div>
                        ) : null}
                      </>
                    )}
                    {activeReportTab === "empathy" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.empathy)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.empathyNote}</p>
                      </>
                    )}
                    {activeReportTab === "economy" && (
                      <>
                        <p className="text-xs text-zinc-500">
                          Punteggio: {Math.round(reportData.scores.economy)}/100
                        </p>
                        <p className="whitespace-pre-line">{reportData.feedback.economyNote}</p>
                      </>
                    )}
                  </>
                )}
                {!reportLoading && !reportData && !reportError && (
                  <div className="text-sm text-zinc-500">Report non disponibile.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-stretch justify-center px-4 pt-16 pb-10">
      <SimulatorNavBar
        dismissCase={
          persistReports && disclaimerAccepted
            ? { loading: dismissLoading, onClick: handleDismissCase }
            : undefined
        }
      />
      <div className="w-full max-w-6xl flex flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Simulazione caso clinico
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight">{initialCaseData.title}</h1>
              {isVariant ? (
                <Badge className="border-purple-500 text-purple-700 bg-purple-50 inline-flex items-center gap-1 text-[10px]">
                  <Sparkles className="w-3 h-3" />
                  Variante IA
                </Badge>
              ) : (
                <Badge className="text-[10px]">Caso originale</Badge>
              )}
            </div>
            <p className="text-xs text-zinc-600">
              {initialCaseData.specialty
                ? `${initialCaseData.specialty} · Obiettivo: ottimizzare rischio clinico, responsabilità medico-legale e risorse.`
                : "Obiettivo: gestire il percorso diagnostico-terapeutico ottimizzando rischio clinico, responsabilità medico-legale e risorse."}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-xs text-zinc-600 shadow-sm">
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sessione in corso</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 items-start">
          <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Interfaccia clinica
                </CardTitle>
                <CardDescription>
                  Alterna tra anamnesi, esame obiettivo e richieste di esami.
                </CardDescription>
              </div>
              <TabsList>
                <TabsTrigger
                  value="history"
                  currentValue={activeTab}
                  onSelect={(value) => setActiveTab(value as typeof activeTab)}
                >
                  Anamnesi
                </TabsTrigger>
                <TabsTrigger
                  value="exam"
                  currentValue={activeTab}
                  onSelect={(value) => setActiveTab(value as typeof activeTab)}
                >
                  Esame obiettivo
                </TabsTrigger>
                <TabsTrigger
                  value="tests"
                  currentValue={activeTab}
                  onSelect={(value) => setActiveTab(value as typeof activeTab)}
                >
                  Richiesta esami
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as typeof activeTab)}
              >
                <TabsContent
                  value="history"
                  currentValue={activeTab}
                  className="mt-3"
                >
                  <HistoryChat
                    messages={messages}
                    input={input}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    isLoading={isChatLoading}
                  />
                </TabsContent>
                <TabsContent
                  value="exam"
                  currentValue={activeTab}
                  className="mt-3"
                >
                  <PhysicalExamTab
                    sessionId={effectiveSessionId}
                    patientPrompt={initialCaseData.patientPrompt}
                    caseId={initialCaseData.id}
                    onExamResult={handleExamFinding}
                  />
                </TabsContent>
                <TabsContent
                  value="tests"
                  currentValue={activeTab}
                  className="mt-3"
                >
                  <ExamsPanel
                    availableExams={AVAILABLE_EXAMS}
                    selectedExamIds={selectedExamIds}
                    onToggleExam={toggleExam}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Paziente
                  </CardTitle>
                  <CardDescription>Identificativo caso e dati essenziali.</CardDescription>
                </div>
                <span className="rounded-full bg-white border border-zinc-200/80 px-4 py-1.5 text-xs font-mono text-zinc-800 whitespace-nowrap">
                  {patient.id}
                </span>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100">
                    <HeartPulse className="h-5 w-5 text-rose-500" />
                  </div>
                  <span className="text-sm">
                    {patient.age} anni – {patient.sex === "M" ? "Maschio" : "Femmina"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPatientChartOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  title="Apri cartella paziente"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Monitor simulazione
                  </CardTitle>
                  <CardDescription>
                    Tempo procedurale e costo cumulativo degli esami richiesti.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-zinc-200/80 px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-600" />
                    <span className="text-sm font-medium text-zinc-800">
                      {totalMinutes || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EuroIcon className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-zinc-800">
                      {totalCost.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-500">
                    Esami richiesti
                  </span>
                  {selectedExams.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      Nessun esame ancora richiesto. Ogni richiesta aggiorna automaticamente tempo e costo simulati.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs">
                      {selectedExams.map((exam) => (
                        <li
                          key={exam.id}
                          className="flex items-center justify-between rounded-2xl bg-white border border-zinc-200/80 px-3 py-1.5"
                        >
                          <span className="truncate text-zinc-950">{exam.name}</span>
                          <span className="ml-3 flex items-center gap-3 text-[11px] text-zinc-500">
                            <span>{exam.timeMinutes}</span>
                            <span>{exam.cost}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 border-zinc-200/80 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Conclusione caso
                </CardTitle>
                <CardDescription>
                  Emetti diagnosi e trattamento, gestisci eventuali imprevisti e consulta il report finale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {gameStatus === "playing" && (
                  <div className="space-y-4">
                    {debugTargetCondition && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
                        <span className="font-medium">Debug – patologia target (sessione):</span>{" "}
                        {debugTargetCondition}
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-zinc-700">
                        Diagnosi finale
                      </label>
                      <Textarea
                        className="min-h-24 text-xs"
                        placeholder="Scrivi la diagnosi finale (es. NSTEMI, polmonite lobare, ecc.)..."
                        value={finalDiagnosis}
                        onChange={(e) => setFinalDiagnosis(e.target.value)}
                      />
                    </div>

                    <div className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-zinc-800">
                            Abilita Imprevisti AI (20% probabilità)
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            Se attivo, può comparire una complicazione improvvisa.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEnableAiSurprises((v) => !v)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                            enableAiSurprises
                              ? "bg-emerald-500/90 border-emerald-600"
                              : "bg-zinc-200 border-zinc-300"
                          }`}
                          aria-pressed={enableAiSurprises}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                              enableAiSurprises ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setForceAiSurprise((v) => !v)}
                        className={`text-[11px] font-medium rounded-full border px-3 py-1.5 transition-colors ${
                          forceAiSurprise
                            ? "bg-amber-50 border-amber-200 text-amber-900"
                            : "bg-white border-zinc-200/80 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                        }`}
                        title="Solo test: forza sempre l'imprevisto quando la diagnosi è corretta"
                      >
                        {forceAiSurprise ? "Forza imprevisto: ON" : "Forza imprevisto: OFF"}
                      </button>
                    </div>

                    <Button
                      type="button"
                      size="lg"
                      className="w-full justify-center text-sm"
                      onClick={confirmDiagnosis}
                      disabled={!finalDiagnosis.trim()}
                    >
                      Conferma Diagnosi
                    </Button>
                  </div>
                )}

                {gameStatus === "checking_diagnosis" && (
                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 px-3 py-3 text-zinc-700">
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4 animate-spin text-sky-600" />
                      Verifica diagnosi in corso...
                    </span>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      Simulazione chiamata AI (2 secondi).
                    </p>
                  </div>
                )}

                {(gameStatus === "wrong_diagnosis" ||
                  gameStatus === "success" ||
                  gameStatus === "complication") && (
                  <div className="space-y-3">
                    {gameStatus === "wrong_diagnosis" && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-rose-800">
                        Diagnosi Errata. Il trattamento somministrato ha peggiorato il quadro.
                        {expectedConditionText && (
                          <div className="mt-2 text-[11px] text-rose-700">
                            <span className="font-medium">Patologia corretta:</span>{" "}
                            {expectedConditionText}
                          </div>
                        )}
                      </div>
                    )}
                    {gameStatus === "success" && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-800">
                        Diagnosi Corretta! Il paziente è stato trattato con successo ed è in via di dimissione.
                      </div>
                    )}
                    {gameStatus === "complication" && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900">
                        Diagnosi Corretta, MA il paziente ha sviluppato una reazione allergica grave e improvvisa!
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      {gameStatus === "complication" ? (
                        <Button
                          type="button"
                          size="md"
                          className="text-xs px-4"
                          onClick={async () => {
                            if (isStartingEmergency) return;
                            setIsStartingEmergency(true);
                            try {
                              const sid = await ensureSessionId();
                              if (!sid) return;

                              await fetch("/api/session/complication", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  sessionId: sid,
                                  caseId: initialCaseData.id,
                                  basePatientPrompt: initialCaseData.patientPrompt,
                                  complication: "anaphylaxis",
                                }),
                              });

                              setDebugTargetCondition("Anafilassi / reazione allergica grave");
                              setFinalDiagnosis("");
                              setGameStatus("playing");
                              // NON navighiamo/ricarichiamo: vogliamo mantenere chat e reperti già raccolti.
                              // Le prossime richieste a /api/chat e /api/examine useranno sessionId e quindi
                              // il prompt/overrides aggiornati in questa sessione.
                            } finally {
                              setIsStartingEmergency(false);
                            }
                          }}
                          disabled={isStartingEmergency}
                        >
                          {isStartingEmergency ? "Avvio emergenza..." : "Gestisci emergenza"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="md"
                          className="text-xs px-4"
                          onClick={async () => {
                            setReportError(null);
                            setReportLoading(true);
                            setGameStatus("showing_report");
                            try {
                              const res = await fetch("/api/evaluate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  caseId: initialCaseData.id,
                                  chatHistory: messages
                                    .filter((m) => m.role === "user" || m.role === "assistant")
                                    .map((m) => ({ role: m.role, content: m.content })),
                                  exams: selectedExams,
                                  reportText: "",
                                  caseContext: initialCaseData.patientPrompt,
                                  finalDiagnosis,
                                }),
                              });
                              if (!res.ok) {
                                const data = await res.json().catch(() => null);
                                throw new Error(
                                  (data && (data.error as string | undefined)) ||
                                    "Errore nella generazione del report.",
                                );
                              }
                              const data = await res.json();
                              setReportData({
                                scores: data.scores,
                                feedback: data.feedback,
                                evidence: data.evidence,
                                totalScore: data.totalScore,
                              });
                            } catch (e: any) {
                              setReportError(e?.message ?? "Errore nella generazione del report.");
                            } finally {
                              setReportLoading(false);
                            }
                          }}
                        >
                          Vai al Report
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isPatientChartOpen}>
        <DialogContent className="bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cartella paziente</DialogTitle>
            <DialogDescription>
              Riepilogo sintomi principali, contesto e dati già raccolti in questa sessione.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5">
              <p className="text-[11px] font-medium text-zinc-700 mb-1">Dati anagrafici</p>
              <p className="text-sm text-zinc-900">
                {patient.age} anni – {patient.sex === "M" ? "Maschio" : "Femmina"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">{patient.id}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">Sintomo principale</p>
              <p className="text-sm text-zinc-900">{patient.mainComplaint}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">Contesto</p>
              <p className="text-xs text-zinc-700 whitespace-pre-line">{patient.context}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">
                Esami obiettivi già effettuati in questa sessione
              </p>
              {Object.keys(examFindings).length === 0 ? (
                <p className="text-[11px] text-zinc-500">
                  Nessun reperto di esame obiettivo ancora registrato.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {Object.values(examFindings).map((exam) => (
                    <li
                      key={exam.id}
                      className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs"
                    >
                      <p className="font-medium text-zinc-800">{exam.label}</p>
                      <p className="text-zinc-700 mt-0.5">
                        {exam.finding}
                        {typeof exam.numericValue === "number" && (
                          <span className="ml-1 text-zinc-500">({exam.numericValue})</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-zinc-700">Esami richiesti</p>
              {selectedExams.length === 0 ? (
                <p className="text-[11px] text-zinc-500">
                  Nessun esame ancora richiesto in questa sessione.
                </p>
              ) : (
                <ul className="space-y-1">
                  {selectedExams.map((exam) => (
                    <li key={exam.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-800">{exam.name}</span>
                      <span className="text-zinc-500">
                        {exam.timeMinutes} · {exam.cost}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              size="sm"
              className="text-xs"
              onClick={() => setIsPatientChartOpen(false)}
            >
              Chiudi cartella
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!disclaimerAccepted}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disclaimer medico-legale</DialogTitle>
            <DialogDescription>
              Questa piattaforma è destinata esclusivamente a scopi formativi e di simulazione.
              Le decisioni proposte dall&apos;app, dai modelli di intelligenza artificiale o dai
              contenuti dei casi non sostituiscono in alcun modo il giudizio clinico,
              l&apos;esperienza professionale o le linee guida ufficiali in vigore.
              <br />
              <br />
              Non utilizzare IterMed per prendere decisioni reali su pazienti o situazioni cliniche.
              Qualsiasi uso improprio ricade interamente sotto la responsabilità dell&apos;utente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Torna al dashboard
            </Link>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="text-xs"
              onClick={() => setDisclaimerAccepted(true)}
            >
              Accetto e desidero procedere
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type HistoryChatProps = {
  messages: {
    id: string;
    role: "user" | "assistant" | "system" | "function" | "data" | "tool";
    content?: string | Array<{ type?: string; text?: string } | string>;
    parts?: Array<{ type?: string; text?: string }>;
  }[];
  input: string;
  onInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
};

function HistoryChat({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: HistoryChatProps) {
  const messageText = (message: HistoryChatProps["messages"][number]): string => {
    if (typeof message.content === "string" && message.content.trim()) {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      const text = message.content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && typeof part.text === "string") return part.text;
          return "";
        })
        .join("");
      if (text.trim()) return text;
    }
    if (Array.isArray(message.parts)) {
      const text = message.parts
        .filter((part) => part?.type === "text" && typeof part.text === "string")
        .map((part) => part.text as string)
        .join("");
      if (text.trim()) return text;
    }
    return "";
  };

  const visibleMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/70 border border-zinc-200/80 p-3 h-[420px] overflow-hidden">
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1.5">
        {visibleMessages.length === 0 && (
          <p className="text-[11px] text-zinc-500">
            Inizia l&apos;anamnesi ponendo una domanda aperta al paziente (es. &quot;Mi racconti cosa è successo da quando sono iniziati i sintomi&quot;).
          </p>
        )}
        {visibleMessages.map((message) => {
          const isDoctor = message.role === "user";
          const text = messageText(message);
          if (!text) return null;
          return (
            <div
              key={message.id}
              className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  isDoctor
                    ? "max-w-[70%] rounded-2xl bg-sky-600 text-white text-xs px-3 py-2 shadow-sm"
                    : "max-w-[70%] rounded-2xl bg-zinc-100 text-zinc-900 text-xs px-3 py-2 border border-zinc-200/80"
                }
              >
                {text}
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={onSubmit}
        className="mt-1 space-y-1.5"
      >
        <Textarea
          className="text-xs"
          rows={2}
          placeholder="Formula la prossima domanda o esplora un sintomo (es. caratteristiche del dolore, fattori di rischio, sintomi associati)..."
          value={input}
          onChange={onInputChange}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500">
            L&apos;IA risponde solo come paziente, senza formulare diagnosi o spiegare linee guida.
          </p>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="px-4 py-1.5 text-[11px]"
          >
            {isLoading ? "Risposta in corso..." : "Invia domanda"}
          </Button>
        </div>
      </form>
    </div>
  );
}

type ExamsPanelProps = {
  availableExams: Exam[];
  selectedExamIds: string[];
  onToggleExam: (id: string) => void;
};

function ExamsPanel({ availableExams, selectedExamIds, onToggleExam }: ExamsPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/70 border border-zinc-200/80 p-3 h-[420px] overflow-y-auto text-xs">
      <p className="text-zinc-600 mb-1">
        Seleziona gli esami che ritieni appropriati. Il monitor a destra aggiornerà in tempo reale
        il costo e il tempo procedurale simulato.
      </p>
      <div className="space-y-2">
        {availableExams.map((exam) => {
          const isSelected = selectedExamIds.includes(exam.id);
          return (
            <button
              key={exam.id}
              type="button"
              onClick={() => onToggleExam(exam.id)}
              className={
                isSelected
                  ? "flex w-full items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] text-zinc-900"
                  : "flex w-full items-center justify-between rounded-2xl border border-zinc-200/80 bg-white px-3 py-2 text-[11px] text-zinc-900 hover:bg-zinc-100 transition-colors"
              }
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{exam.name}</span>
                <span className="text-[10px] text-zinc-500">
                  Tempo stimato: {exam.timeMinutes} min
                </span>
              </div>
              <span className="ml-3 text-[11px] font-medium">
                € {exam.cost}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

