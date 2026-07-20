"use client";

import { type ComponentType, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "ai/react";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  Clock,
  EuroIcon,
  Microscope,
  ScanLine,
  Search,
  Sparkles,
  FolderOpen,
  TestTube2,
  User,
  Stethoscope,
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
import { handleTextareaEnterSubmit } from "@/lib/hooks/textarea-submit";
import { Badge } from "../../app/ui/badge";
import { PhysicalExamTab } from "./PhysicalExamTab";
import { PatientStressBar } from "./PatientStressBar";
import { SafeLlmText } from "@/components/ui/safe-llm-content";
import { SkeletonChatBubble } from "@/components/ui/Skeleton";
import { VitalSignsBoard } from "./VitalSignsBoard";
import {
  ClinicalDischargeReportPanel,
  composeClinicalReport,
  extractFinalDiagnosisFromReport,
  isClinicalReportComplete,
  type ClinicalReportSections,
} from "./ClinicalDischargeReportPanel";
import { MetricBar } from "@/app/case/[id]/results/MetricBar";
import { ScoreProgressRing } from "@/app/case/[id]/results/ScoreProgressRing";
import { patientDisplayName, deriveDemoVitals } from "@/lib/prassi/demo-vitals";
import { resolveCaseStressProfile } from "@/lib/simulator/patient-stress-engine";
import { AequanLogo } from "@/components/AequanLogo";
import { EXAM_DEFAULT_VALUES, type ExamClinicalMeta } from "../../lib/exam-default-values";
import { EXAM_CATALOG_STRUCTURE } from "@/lib/exam-catalog-structure";
import {
  applyExamMeta,
  buildExamMacroCatalog,
  flattenExams,
  formatExamFinding,
  type ExamMacroCategory,
  type SimulatorExam,
} from "../../lib/simulator/exam-catalog";
import type { CaseExamOverride } from "../../lib/exam-values-meta";
import {
  formatAbnormalExamsFromBaseline,
  formatVitalSignsFromBaseline,
} from "../../lib/simulator/patientCaseContext";

type Exam = SimulatorExam;

type ChatMessageLike = {
  id: string;
  role: string;
  content?: string | Array<{ type?: string; text?: string } | string>;
  parts?: Array<{ type?: string; text?: string }>;
};

/** Costs/timings resolved at runtime from ExamMetadata DB + case overrides. */
const RAW_EXAM_CATALOG_STRUCTURE: ExamMacroCategory[] = EXAM_CATALOG_STRUCTURE;

/** Valori esami salvati in creazione caso (`baselineExamFindings.advancedExams.values`) */
type CaseExamStoredValues = CaseExamOverride;

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
  /** Da DB: include advancedExams.values compilati in creazione caso */
  baselineExamFindings?: Record<string, unknown>;
  timeLimitMinutes?: number | null;
  examLatencies?: Record<string, number> | null;
  goldStandardPath?: string[] | null;
  patientDeteriorationThreshold?: number | null;
};

type SimulatorClientProps = {
  initialCaseData: InitialCaseData;
  isVariant?: boolean;
  sessionId?: string;
  isAdmin?: boolean;
  /** Se false (casi demo senza DB), l’abbandono non crea SessionReport e torna solo al dashboard. */
  persistReports?: boolean;
  /** ExamMetadata catalog merged over static defaults. */
  examCatalog?: Record<string, ExamClinicalMeta>;
  /** Per-case exam values from CaseExamValue table + legacy JSON. */
  caseExamOverrides?: Record<string, CaseExamOverride>;
  /** Modalità embedded nella sezione Prassi (layout dashboard). */
  embedded?: boolean;
  /** Destinazione del pulsante di ritorno (default dashboard). */
  backHref?: string;
};

import type { EliteReportData } from "@/lib/services/simulation-report-data";

type SimulationReportData = EliteReportData;

type ReportStatusPayload = {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  progressMessage: string;
  reportData: SimulationReportData | null;
  error?: string;
};

const REPORT_POLL_INTERVAL_MS = 500;
const REPORT_POLL_TIMEOUT_MS = 3 * 60 * 1000;

type PollReportResult = {
  reportId: string;
  reportData: SimulationReportData;
};

async function pollReportUntilComplete(
  reportId: string,
  onProgress: (progress: number, message: string) => void,
  options?: { signal?: AbortSignal },
): Promise<PollReportResult> {
  const startedAt = Date.now();

  const pollOnce = async (): Promise<PollReportResult | null> => {
    if (options?.signal?.aborted) {
      throw new Error("Generazione report annullata.");
    }

    if (Date.now() - startedAt > REPORT_POLL_TIMEOUT_MS) {
      throw new Error(
        "Timeout durante la generazione del report. Riprova — il server potrebbe aver perso il task in background.",
      );
    }

    const res = await fetch(
      `/api/simulation/report/status?reportId=${encodeURIComponent(reportId)}`,
      { signal: options?.signal },
    );
    const data = (await res.json().catch(() => null)) as ReportStatusPayload | null;
    if (!res.ok || !data) {
      throw new Error(data?.error ?? "Errore nel recupero dello stato del report.");
    }

    onProgress(data.progress, data.progressMessage);

    if (data.status === "COMPLETED") {
      if (!data.reportData) {
        throw new Error("Report completato ma dati non disponibili.");
      }
      return { reportId, reportData: data.reportData };
    }
    if (data.status === "FAILED") {
      throw new Error(data.progressMessage || "Errore durante la generazione.");
    }
    return null;
  };

  const immediate = await pollOnce();
  if (immediate) {
    return immediate;
  }

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      void pollOnce()
        .then((result) => {
          if (result) {
            clearInterval(interval);
            resolve(result);
          }
        })
        .catch((error: unknown) => {
          clearInterval(interval);
          reject(error);
        });
    }, REPORT_POLL_INTERVAL_MS);

    options?.signal?.addEventListener("abort", () => {
      clearInterval(interval);
      reject(new Error("Generazione report annullata."));
    });
  });
}

function ReportGenerationProgress({
  progress,
  message,
}: {
  progress: number;
  message: string;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm text-zinc-700">
        <span className="inline-flex items-center gap-2 min-w-0">
          <Activity className="h-4 w-4 shrink-0 animate-spin text-sky-600" />
          <span className="truncate">{message || "Generazione report in corso..."}</span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">{clampedProgress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-[#345884] transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

function SimulatorNavBar({
  dismissCase,
  backHref = "/dashboard",
  backLabel = "Dashboard",
  embedded = false,
}: {
  dismissCase?: { loading: boolean; onClick: () => void };
  backHref?: string;
  backLabel?: string;
  embedded?: boolean;
}) {
  if (embedded) {
    return (
      <header className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          {backLabel}
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

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex h-12 items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur-md shadow-sm">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        {backLabel}
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
  isAdmin = false,
  persistReports = true,
  examCatalog = EXAM_DEFAULT_VALUES,
  caseExamOverrides = {},
  embedded = false,
  backHref = "/dashboard",
}: SimulatorClientProps) {
  const router = useRouter();

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "exam" | "labs" | "imaging">("history");
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const selectedExamIdsRef = useRef<string[]>([]);
  const [isPatientChartOpen, setIsPatientChartOpen] = useState(false);
  const [patientChartTab, setPatientChartTab] = useState<"base" | "referto">("base");

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
  const [reportSections, setReportSections] = useState<ClinicalReportSections>({
    anamnesisObjective: "",
    diagnosticFindings: "",
    diagnosisTreatment: "",
  });
  const [expectedConditionText, setExpectedConditionText] = useState<string | null>(null);
  const [debugTargetCondition, setDebugTargetCondition] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<
    "clinical" | "legal" | "prescribing" | "empathy" | "economy"
  >("clinical");

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportProgressMessage, setReportProgressMessage] = useState("");
  const [reportData, setReportData] = useState<SimulationReportData | null>(null);

  const [effectiveSessionId, setEffectiveSessionId] = useState<string | undefined>(sessionId);
  const [isStartingEmergency, setIsStartingEmergency] = useState(false);
  const [dismissLoading, setDismissLoading] = useState(false);
  /** 0–100: pressione temporale e carico simulato (chat, esami, errori, tempo). */
  const [patientStress, setPatientStress] = useState(0);
  const patientStressRef = useRef(patientStress);
  /** Minuti clinici trascorsi (timer simulato + interazioni), esclusi i tempi degli esami. */
  const [clockMinutes, setClockMinutes] = useState(0);
  const effectiveSessionIdRef = useRef(effectiveSessionId);
  const examIdsChargedForStressRef = useRef<Set<string>>(new Set());
  const stressInitializedRef = useRef(false);

  useEffect(() => {
    patientStressRef.current = patientStress;
  }, [patientStress]);

  // Apply case baseline stress once (e.g. STEMI seed initialStress: 75).
  useEffect(() => {
    if (stressInitializedRef.current) return;
    const profile = resolveCaseStressProfile({
      description: initialCaseData.description,
      baselineExamFindings: initialCaseData.baselineExamFindings as Record<string, unknown> | undefined,
      goldStandardPath: initialCaseData.goldStandardPath ?? undefined,
    });
    stressInitializedRef.current = true;
    setPatientStress(profile.initialStress);
    patientStressRef.current = profile.initialStress;
  }, [
    initialCaseData.description,
    initialCaseData.baselineExamFindings,
    initialCaseData.goldStandardPath,
  ]);

  useEffect(() => {
    effectiveSessionIdRef.current = effectiveSessionId;
  }, [effectiveSessionId]);

  useEffect(() => {
    selectedExamIdsRef.current = selectedExamIds;
  }, [selectedExamIds]);

  useEffect(() => {
    const onClinicalAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "prescribe") setActiveTab("labs");
      if (action === "consult") setActiveTab("history");
      if (action === "diagnose") {
        /* scroll handled by workspace shell */
      }
    };
    window.addEventListener("aequan-clinical-action", onClinicalAction);
    return () => window.removeEventListener("aequan-clinical-action", onClinicalAction);
  }, []);

  const advanceClock = useCallback((deltaMinutes = 1) => {
    if (deltaMinutes <= 0) return;
    setClockMinutes((m) => m + deltaMinutes);
  }, []);

  const bumpPatientStress = useCallback((delta: number) => {
    if (delta <= 0) return;
    setPatientStress((s) => Math.min(100, s + delta));
  }, []);

  // Timer clinico: +1 minuto simulato ogni 15s reali mentre il caso è in corso.
  useEffect(() => {
    if (!disclaimerAccepted || gameStatus !== "playing") return;
    const id = window.setInterval(() => {
      setClockMinutes((m) => m + 1);
      bumpPatientStress(1);
    }, 15_000);
    return () => window.clearInterval(id);
  }, [disclaimerAccepted, gameStatus, bumpPatientStress]);

  // Pressione temporale aggiuntiva (più lenta).
  useEffect(() => {
    if (!disclaimerAccepted || gameStatus !== "playing") return;
    const id = window.setInterval(() => {
      bumpPatientStress(2);
    }, 45_000);
    return () => window.clearInterval(id);
  }, [disclaimerAccepted, gameStatus, bumpPatientStress]);

  const demoChat = initialCaseData.demographics ?? {};
  const patientAgeForChat = demoChat.age ?? 58;
  const patientSexForChat =
    demoChat.sex === "F" || demoChat.sex === "M" ? demoChat.sex : "M";

  const vitalSignsForChat = useMemo(
    () =>
      formatVitalSignsFromBaseline(
        initialCaseData.baselineExamFindings as Record<string, unknown> | undefined,
      ),
    [initialCaseData.baselineExamFindings],
  );

  const abnormalExamsForChat = useMemo(
    () =>
      formatAbnormalExamsFromBaseline(
        initialCaseData.baselineExamFindings as Record<string, unknown> | undefined,
      ),
    [initialCaseData.baselineExamFindings],
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: submitChatMessage,
    isLoading: isChatLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    streamProtocol: "data",
    experimental_throttle: 30,
    keepLastMessageOnError: true,
    body: {
      casePrompt: initialCaseData.patientPrompt,
      caseId: initialCaseData.id,
      patientAge: patientAgeForChat,
      patientSex: patientSexForChat,
      chiefComplaint: initialCaseData.description,
      vitalSigns: vitalSignsForChat,
      abnormalExams: abnormalExamsForChat,
      trueDiagnosis: initialCaseData.correctSolution ?? undefined,
    },
    experimental_prepareRequestBody: ({ messages: chatMessages, requestBody }) => ({
      ...(requestBody ?? {}),
      sessionId: effectiveSessionIdRef.current,
      patientStress: patientStressRef.current,
      requestedExamIds: selectedExamIdsRef.current,
      messages: chatMessages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "",
      })),
    }),
    onFinish: () => {
      // Dopo ogni risposta paziente: micro-incremento stress (ansia / tempo clinico).
      bumpPatientStress(1);
    },
    onError: () => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant") return prev;
        const existing =
          typeof last.content === "string" && last.content.length > 0
            ? last.content
            : "Errore nella chat. Riprova tra qualche secondo.";
        return [...prev.slice(0, -1), { ...last, content: existing }];
      });
    },
  });

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
      router.push(backHref);
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
    if (!isAdmin || !effectiveSessionId) return;
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
  }, [effectiveSessionId, isAdmin]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isChatLoading) return;

    const stressForRequest = Math.min(100, patientStress + 2);
    setPatientStress(stressForRequest);
    patientStressRef.current = stressForRequest;
    advanceClock(1);

    submitChatMessage(event);
  };

  const caseAdvancedExamValues = useMemo((): Record<string, CaseExamStoredValues> => {
    const bf = initialCaseData.baselineExamFindings as
      | { advancedExams?: { values?: Record<string, CaseExamStoredValues> } }
      | undefined;
    const legacy = bf?.advancedExams?.values ?? {};
    return { ...legacy, ...caseExamOverrides };
  }, [initialCaseData.baselineExamFindings, caseExamOverrides]);

  const examMacroCatalog = useMemo(
    () => buildExamMacroCatalog(RAW_EXAM_CATALOG_STRUCTURE, examCatalog),
    [examCatalog],
  );

  const availableExams = useMemo(() => flattenExams(examMacroCatalog), [examMacroCatalog]);

  const resolveExamForSelection = useCallback(
    (exam: Exam) => applyExamMeta(exam, examCatalog, caseAdvancedExamValues[exam.id]),
    [examCatalog, caseAdvancedExamValues],
  );

  const selectedExams = useMemo(
    () =>
      selectedExamIds
        .map((id) => availableExams.find((exam) => exam.id === id))
        .filter((exam): exam is Exam => Boolean(exam))
        .map(resolveExamForSelection),
    [selectedExamIds, availableExams, resolveExamForSelection],
  );
  const selectedExamsRecentFirst = useMemo(() => [...selectedExams].reverse(), [selectedExams]);
  const objectiveFindingsRecentFirst = useMemo(
    () => [...Object.values(examFindings)].reverse(),
    [examFindings],
  );

  const totalCost = selectedExams.reduce((sum, exam) => sum + exam.cost, 0);
  const caseExamLatencies = initialCaseData.examLatencies ?? {};
  const examLatencyMinutes = useMemo(() => {
    return selectedExamIds.reduce((sum, examId) => {
      const custom = caseExamLatencies[examId];
      if (custom != null) return sum + custom;
      const exam = selectedExams.find((e) => e.id === examId);
      return sum + (exam?.timeMinutes ?? 5);
    }, 0);
  }, [selectedExamIds, caseExamLatencies, selectedExams]);

  /** Tempo clinico visualizzato = timer simulato + latenze esami. */
  const totalMinutes = clockMinutes + examLatencyMinutes;

  const reportGenerationAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      reportGenerationAbortRef.current?.abort();
    };
  }, []);

  const generateReportAndNavigate = useCallback(async () => {
    reportGenerationAbortRef.current?.abort();
    const abortController = new AbortController();
    reportGenerationAbortRef.current = abortController;

    setReportError(null);
    setReportLoading(true);
    setReportProgress(10);
    setReportProgressMessage("Inizializzazione report...");

    try {
      const liveSessionId = await ensureSessionId();
      const diagnosisForEval =
        extractFinalDiagnosisFromReport(reportSections).trim() || finalDiagnosis.trim();
      const composedReport = composeClinicalReport(reportSections);

      if (liveSessionId) {
        setReportProgressMessage("Sincronizzazione milestone clinici...");
        const examLabels: Record<string, string> = {};
        for (const exam of selectedExams) {
          examLabels[exam.id] = exam.name;
        }
        const lastUserMessage = [...messages]
          .reverse()
          .find((m) => m.role === "user");
        await fetch("/api/session/sync-milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: liveSessionId,
            caseId: initialCaseData.id,
            requestedExamIds: selectedExamIdsRef.current,
            examLabels,
            prescribedExams: selectedExams.map((e) => ({ id: e.id, name: e.name })),
            lastUserMessage: lastUserMessage
              ? getChatMessageText(lastUserMessage)
              : undefined,
          }),
          signal: abortController.signal,
        });
      }

      setReportProgressMessage("Inizializzazione report...");
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: initialCaseData.id,
          sessionId: liveSessionId ?? undefined,
          chatHistory: messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: getChatMessageText(m),
            })),
          exams: selectedExams,
          reportText: composedReport,
          caseContext: initialCaseData.patientPrompt,
          finalDiagnosis: diagnosisForEval,
        }),
        signal: abortController.signal,
      });

      const data = await res.json().catch(() => null);

      if (res.status !== 202 && !res.ok) {
        throw new Error(
          (data && (data.error as string | undefined)) || "Errore nella generazione del report.",
        );
      }

      const reportId =
        data &&
        (typeof data.reportId === "string"
          ? data.reportId
          : typeof data.sessionId === "string"
            ? data.sessionId
            : null);

      if (!reportId) {
        throw new Error("ID report non disponibile.");
      }

      if (typeof data.progress === "number") {
        setReportProgress(data.progress);
      }
      if (typeof data.progressMessage === "string") {
        setReportProgressMessage(data.progressMessage);
      }

      const { reportId: completedReportId } = await pollReportUntilComplete(
        reportId,
        (progress, message) => {
          setReportProgress(progress);
          setReportProgressMessage(message);
        },
        { signal: abortController.signal },
      );

      router.push(`/case/${initialCaseData.id}/results?sessionId=${completedReportId}`);
      router.refresh();
    } catch (e) {
      if (abortController.signal.aborted) {
        return;
      }
      const message =
        e instanceof Error ? e.message : "Errore nella generazione del report.";
      setReportError(message);
    } finally {
      if (reportGenerationAbortRef.current === abortController) {
        setReportLoading(false);
        reportGenerationAbortRef.current = null;
      }
    }
  }, [
    finalDiagnosis,
    initialCaseData.id,
    initialCaseData.patientPrompt,
    messages,
    reportSections,
    router,
    selectedExams,
  ]);

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

  const ingressVitals = deriveDemoVitals(initialCaseData.id, patientStress);
  const chartIsEmpty =
    selectedExams.length === 0 && Object.keys(examFindings).length === 0;

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
    bumpPatientStress(3);
    advanceClock(2);
  };

  const toggleExam = (examId: string) => {
    setSelectedExamIds((current) => {
      if (current.includes(examId)) {
        return current;
      }
      const charged = examIdsChargedForStressRef.current;
      if (!charged.has(examId)) {
        charged.add(examId);
        bumpPatientStress(2);
        advanceClock(1);
      }
      const next = [...current, examId];
      void (async () => {
        const sid = effectiveSessionIdRef.current ?? (await ensureSessionId());
        if (!sid) return;
        const labelFor = (id: string) =>
          availableExams.find((e) => e.id === id)?.name ?? id;
        await fetch("/api/session/sync-milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            caseId: initialCaseData.id,
            requestedExamIds: next,
            examLabels: Object.fromEntries(next.map((id) => [id, labelFor(id)])),
            prescribedExams: next.map((id) => ({ id, name: labelFor(id) })),
          }),
        }).catch(() => {
          /* non-blocking: evaluation will re-sync */
        });
      })();
      return next;
    });
  };

  const confirmDiagnosis = () => {
    const diagnosisText = extractFinalDiagnosisFromReport(reportSections).trim();
    if (!isClinicalReportComplete(reportSections) || !diagnosisText) return;
    setFinalDiagnosis(diagnosisText);
    setGameStatus("checking_diagnosis");

    window.setTimeout(async () => {
      try {
        const sid = effectiveSessionIdRef.current ?? (await ensureSessionId());
        const res = await fetch("/api/session/check-diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: initialCaseData.id,
            sessionId: sid,
            diagnosisText,
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

          if (sid) {
            await fetch("/api/session/outcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sid,
                caseId: initialCaseData.id,
                basePatientPrompt: initialCaseData.patientPrompt,
                outcome: "success",
              }),
            });
            router.replace(`/case/${initialCaseData.id}?sessionId=${sid}`);
          }
          return;
        }

        setGameStatus("wrong_diagnosis");
        bumpPatientStress(20);
        if (sid) {
          await fetch("/api/session/outcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sid,
              caseId: initialCaseData.id,
              basePatientPrompt: initialCaseData.patientPrompt,
              outcome: "wrong_diagnosis",
            }),
          });
          router.replace(`/case/${initialCaseData.id}?sessionId=${sid}`);
        }
      } catch {
        // fallback safe: don't block the flow; treat as success but without surprise
        setGameStatus("success");
      }
    }, 2000);
  };

  if (gameStatus === "showing_report") {
    return (
      <div
        className={
          embedded
            ? "flex w-full min-w-0 flex-col bg-transparent text-text-primary"
            : "flex min-h-screen w-full items-stretch justify-center bg-ui-bg px-4 pb-10 pt-16 text-text-primary"
        }
      >
        {!embedded ? (
          <SimulatorNavBar backHref={backHref} backLabel="Torna alla Prassi" />
        ) : null}
        <div className="flex w-full min-w-0 flex-col gap-6 pb-12">
          <Card className="w-full rounded-xl border border-border bg-panel-bg shadow-aequan-panel">
            <CardHeader>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Report di performance
              </p>
              <CardTitle className="text-base font-semibold text-brand-primary">Report finale</CardTitle>
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
                        "relative -mb-px flex items-center gap-2 rounded-t-xl border px-4 py-2 text-[11px] font-medium transition-colors whitespace-nowrap " +
                        (isActive
                          ? "border-slate-200 bg-white text-slate-900 shadow-sm"
                          : "border-transparent bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900")
                      }
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-6 rounded-b-2xl rounded-tr-2xl border border-slate-100 bg-white p-5">
                {reportLoading && (
                  <ReportGenerationProgress
                    progress={reportProgress}
                    message={reportProgressMessage}
                  />
                )}
                {!reportLoading && reportError && (
                  <div className="text-sm text-rose-700">{reportError}</div>
                )}
                {!reportLoading && reportData && (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-10 border-b border-slate-100 pb-6">
                      <ScoreProgressRing
                        score={reportData.scores.clinical}
                        label="Accuratezza clinica"
                      />
                      <ScoreProgressRing score={reportData.scores.legal} label="Tutela medico-legale" />
                    </div>
                    <div className="space-y-4">
                      <MetricBar label="Accuratezza clinica" score={reportData.scores.clinical} />
                      <MetricBar label="Tutela medico-legale" score={reportData.scores.legal} />
                      <MetricBar label="Appropriatezza esami" score={reportData.scores.exams} />
                      <MetricBar label="Empatia" score={reportData.scores.empathy} />
                      <MetricBar label="Sostenibilità economica" score={reportData.scores.economy} />
                    </div>
                    {activeReportTab === "clinical" && (
                      <div className="rounded-xl border border-slate-100 border-l-4 border-l-[#345884] bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Feedback clinico
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {reportData.feedback?.clinicalNote ?? "—"}
                        </p>
                      </div>
                    )}
                    {activeReportTab === "legal" && (
                      <div className="rounded-xl border border-slate-100 border-l-4 border-l-[#345884] bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Feedback medico-legale
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {reportData.feedback?.legalComplianceNote ?? "—"}
                        </p>
                        {reportData.evidence?.legalSources?.length ? (
                          <div className="mt-3 text-xs text-slate-600">
                            <span className="font-medium">Fonti (tag: legale):</span>{" "}
                            {reportData.evidence.legalSources.join(" · ")}
                          </div>
                        ) : null}
                      </div>
                    )}
                    {activeReportTab === "prescribing" && (
                      <div className="rounded-xl border border-slate-100 border-l-4 border-l-[#345884] bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Feedback prescrittivo
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {reportData.feedback?.prescribingNote ?? "—"}
                        </p>
                        {reportData.evidence?.protocolSources?.length ? (
                          <div className="mt-3 text-xs text-slate-600">
                            <span className="font-medium">Fonti (tag: protocolli):</span>{" "}
                            {reportData.evidence.protocolSources.join(" · ")}
                          </div>
                        ) : null}
                      </div>
                    )}
                    {activeReportTab === "empathy" && (
                      <div className="rounded-xl border border-slate-100 border-l-4 border-l-[#345884] bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Feedback empatia
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {reportData.feedback?.empathyNote ?? "—"}
                        </p>
                      </div>
                    )}
                    {activeReportTab === "economy" && (
                      <div className="rounded-xl border border-slate-100 border-l-4 border-l-[#345884] bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Feedback economico
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                          {reportData.feedback?.economyNote ?? "—"}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {!reportLoading && !reportData && !reportError && (
                  <div className="text-sm text-slate-500">Report non disponibile.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden overflow-hidden bg-transparent text-text-primary"
          : "flex min-h-screen w-full items-stretch justify-center overflow-x-hidden bg-ui-bg px-4 pb-10 pt-16 text-text-primary"
      }
    >
      {!embedded ? (
        <SimulatorNavBar
          backHref={backHref}
          backLabel={backHref.includes("prassi") ? "Torna alla Prassi" : "Dashboard"}
          dismissCase={
            persistReports && disclaimerAccepted
              ? { loading: dismissLoading, onClick: handleDismissCase }
              : undefined
          }
        />
      ) : null}
      <div
        className={
          embedded
            ? "flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-x-hidden overflow-hidden font-[family-name:var(--font-inter)]"
            : "flex w-full min-w-0 flex-col gap-3 overflow-x-hidden font-[family-name:var(--font-inter)]"
        }
      >
        {embedded && persistReports && disclaimerAccepted ? (
          <div className="flex shrink-0 justify-end overflow-x-hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-rose-200/80 text-xs text-rose-800 hover:bg-rose-50"
              disabled={dismissLoading}
              onClick={handleDismissCase}
              title="Dismiss case — all scores recorded as 0"
            >
              {dismissLoading ? "Uscita…" : "Abbandona caso"}
            </Button>
          </div>
        ) : null}

        <VitalSignsBoard
          caseId={initialCaseData.id}
          title={initialCaseData.title}
          age={patient.age}
          sex={patient.sex}
          stress={patientStress}
          className="w-full shrink-0 overflow-x-hidden rounded-xl border border-slate-900/60 shadow-md"
        />

        {!embedded ? (
          <header className="flex w-full items-center justify-between gap-4 overflow-x-hidden px-0.5">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Simulazione attiva
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-lg font-semibold tracking-tight text-brand-primary">
                  {initialCaseData.title}
                </h1>
                {isVariant ? (
                  <Badge className="inline-flex items-center gap-1 border-brand-secondary/30 bg-brand-secondary/10 text-[10px] text-brand-secondary">
                    <Sparkles className="h-3 w-3" />
                    Variante IA
                  </Badge>
                ) : (
                  <Badge className="text-[10px]">Caso originale</Badge>
                )}
              </div>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-panel-bg px-3 py-1.5 text-xs text-slate-600 shadow-sm">
              <Activity className="h-3.5 w-3.5 text-brand-secondary" />
              <span>Sessione in corso</span>
            </div>
          </header>
        ) : null}

        {/* Embedded: 9-col host → chat 6 + patient 3 (= overall Prassi 3|6|3). Standalone: 12-col 8|4. */}
        <div
          className={
            embedded
              ? "grid min-h-0 w-full min-w-0 flex-1 grid-cols-1 gap-4 overflow-hidden overflow-x-hidden lg:grid-cols-9"
              : "grid w-full min-w-0 grid-cols-1 gap-4 overflow-x-hidden lg:grid-cols-12 lg:items-start"
          }
        >
          {/* Col 2 — Central simulation & chat */}
          <div
            id="aequan-sim-chat"
            className={
              embedded
                ? "col-span-1 flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 lg:col-span-6"
                : "flex min-w-0 flex-col gap-4 overflow-x-hidden lg:col-span-8"
            }
          >
            <Card className="w-full min-w-0 overflow-x-hidden overflow-hidden rounded-xl border border-border bg-panel-bg shadow-aequan-panel">
              <CardHeader className="flex flex-col gap-3 border-b border-border-subtle bg-ui-bg/80 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="font-display text-sm font-bold tracking-tight text-brand-primary">
                    Cartella clinica elettronica
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Anamnesi, esame obiettivo, laboratorio e imaging.
                  </CardDescription>
                </div>
                <TabsList className="flex flex-wrap">
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
                    value="labs"
                    currentValue={activeTab}
                    onSelect={(value) => setActiveTab(value as typeof activeTab)}
                  >
                    Laboratorio
                  </TabsTrigger>
                  <TabsTrigger
                    value="imaging"
                    currentValue={activeTab}
                    onSelect={(value) => setActiveTab(value as typeof activeTab)}
                  >
                    Imaging
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="min-w-0 overflow-x-hidden pt-0">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as typeof activeTab)}
                >
                  <TabsContent value="history" currentValue={activeTab} className="mt-3">
                    <HistoryChat
                      messages={messages}
                      input={input}
                      onInputChange={handleInputChange}
                      onSubmit={handleSubmit}
                      isLoading={isChatLoading}
                      compact={embedded}
                    />
                  </TabsContent>
                  <TabsContent value="exam" currentValue={activeTab} className="mt-3">
                    <PhysicalExamTab
                      sessionId={effectiveSessionId}
                      patientPrompt={initialCaseData.patientPrompt}
                      caseId={initialCaseData.id}
                      onExamResult={handleExamFinding}
                    />
                  </TabsContent>
                  <TabsContent value="labs" currentValue={activeTab} className="mt-3">
                    <ExamsPanel
                      selectedExamIds={selectedExamIds}
                      onToggleExam={toggleExam}
                      caseExamValues={caseAdvancedExamValues}
                      examCatalog={examCatalog}
                      examMacroCatalog={examMacroCatalog}
                      availableExams={availableExams}
                      macroFilter={["lab"]}
                    />
                  </TabsContent>
                  <TabsContent value="imaging" currentValue={activeTab} className="mt-3">
                    <ExamsPanel
                      selectedExamIds={selectedExamIds}
                      onToggleExam={toggleExam}
                      caseExamValues={caseAdvancedExamValues}
                      examCatalog={examCatalog}
                      examMacroCatalog={examMacroCatalog}
                      availableExams={availableExams}
                      macroFilter={["img", "strum", "endo"]}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Col 3 — Patient details, cost, referto */}
          <div
            id="aequan-sim-exams"
            className={
              embedded
                ? "col-span-1 flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto overflow-x-hidden pl-1 pb-4 lg:col-span-3"
                : "flex min-w-0 flex-col gap-4 overflow-x-hidden pb-8 lg:col-span-4"
            }
          >
            <div className="flex min-h-0 min-w-0 flex-col justify-between overflow-x-hidden rounded-xl border border-border bg-panel-bg p-4 shadow-aequan-panel">
              <div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E324E]/5 text-[#345884]">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold tracking-tight text-[#1E324E]">
                      Cartella Clinica Attiva
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {patientDisplayName(
                        initialCaseData.id,
                        initialCaseData.title,
                        patient.sex,
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      ID {patient.id} · {patient.age} anni ·{" "}
                      {patient.sex === "M" ? "Maschio" : "Femmina"}
                    </p>
                  </div>
                </div>
                <hr className="my-3 border-slate-100" />

                <section className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Anamnesi
                  </p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-700">
                    {patient.mainComplaint ||
                      "Motivo di accesso da approfondire con il paziente."}
                  </p>
                  <p className="text-[11px] text-slate-500">Contesto: {patient.context}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientChartTab("base");
                      setIsPatientChartOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg text-[11px] font-medium text-[#345884] transition-colors hover:text-[#1E324E] hover:underline"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Apri cartella completa
                  </button>
                </section>

                <section className="mt-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-[#345884]" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Esame obiettivo
                    </p>
                  </div>
                  {objectiveFindingsRecentFirst.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Nessun reperto obiettivo ancora registrato.
                    </p>
                  ) : (
                    <ul className="max-h-28 space-y-1.5 overflow-y-auto pr-1 text-xs">
                      {objectiveFindingsRecentFirst.map((exam) => (
                        <li
                          key={exam.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-1.5"
                        >
                          <p className="font-medium text-slate-800">{exam.label}</p>
                          <p className="mt-0.5 text-slate-600">
                            {exam.finding}
                            {typeof exam.numericValue === "number" ? (
                              <span className="ml-1 font-mono text-slate-500">
                                ({exam.numericValue})
                              </span>
                            ) : null}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="mt-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-3.5 w-3.5 text-[#345884]" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Esami richiesti
                    </p>
                  </div>
                  {selectedExams.length > 0 ? (
                    <ul className="max-h-28 space-y-1.5 overflow-y-auto pr-1 text-xs">
                      {selectedExamsRecentFirst.map((exam) => (
                        <li
                          key={exam.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-1.5"
                        >
                          <span className="truncate text-slate-800">{exam.name}</span>
                          <span className="ml-3 shrink-0 font-mono text-[11px] tabular-nums text-slate-500">
                            €{exam.cost.toFixed(0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : chartIsEmpty ? (
                    <div className="relative overflow-hidden rounded-2xl border border-[#345884]/15 bg-gradient-to-br from-slate-50 via-white to-[#345884]/[0.06] p-4 shadow-sm">
                      <div
                        className="pointer-events-none absolute -right-2 top-2 opacity-[0.07]"
                        aria-hidden
                      >
                        <AequanLogo height={56} />
                      </div>
                      <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#345884]">
                        Triage d&apos;Ingresso Ospedaliero
                      </p>
                      <div className="mt-3 space-y-2 border-l-2 border-[#1E324E]/20 pl-3 text-[11px] leading-relaxed text-slate-600">
                        <p>
                          <span className="font-semibold text-[#1E324E]">Paziente:</span>{" "}
                          {patientDisplayName(
                            initialCaseData.id,
                            initialCaseData.title,
                            patient.sex,
                          )}
                          , {patient.age} anni ·{" "}
                          {patient.sex === "M" ? "Maschio" : "Femmina"}
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E324E]">ID cartella:</span>{" "}
                          <span className="font-mono">{patient.id}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-[#1E324E]">
                            Motivo di accesso:
                          </span>{" "}
                          {patient.mainComplaint || "Da approfondire in anamnesi"}
                        </p>
                        <div className="rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2 font-mono text-[10px] text-slate-700">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Parametri vitali all&apos;ingresso
                          </p>
                          <p>
                            PA {ingressVitals.bp} · FC {ingressVitals.hr} bpm · SpO₂{" "}
                            {ingressVitals.spo2}% · T {ingressVitals.temp}°C · FR{" "}
                            {ingressVitals.rr}/min
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50/70 px-3 py-2 text-[10px] leading-relaxed text-amber-950/90">
                        In attesa di esami diagnostici. Conduci l&apos;anamnesi via chat o esegui
                        l&apos;esame obiettivo per popolare la cartella.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed text-slate-500">
                      Nessun esame diagnostico richiesto. Reperti di esame obiettivo già
                      registrati in cartella.
                    </p>
                  )}
                </section>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#345884]/10 bg-[#345884]/5 p-3.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#345884]">
                      <EuroIcon className="h-3.5 w-3.5" />
                      Costo SSN
                    </span>
                    <span className="text-[10px] text-slate-500">Budget rif. €250</span>
                  </div>
                  <p className="font-mono text-base font-semibold tracking-tight text-[#1E324E]">
                    Costo Appropriato: €{totalCost.toFixed(2)}
                  </p>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/80 shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1E324E] to-[#345884] transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalCost / 250) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Tempo simulato:{" "}
                    <span className="font-mono font-medium text-slate-700">
                      {formatElapsedTime(totalMinutes)}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Stress paziente
                  </p>
                  <PatientStressBar value={patientStress} />
                </div>
              </div>
            </div>

            <Card id="aequan-sim-conclusion" className="rounded-2xl border border-slate-100 bg-white shadow-md">
              <CardHeader>
                <CardTitle className="font-display text-sm font-bold tracking-tight text-[#1E324E]">
                  Referto di dimissione
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Compila il referto clinico strutturato, conferma la diagnosi e genera il report
                  finale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {gameStatus === "playing" && (
                  <div className="space-y-4">
                    {isAdmin && debugTargetCondition && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
                        <span className="font-medium">Debug – patologia target (sessione):</span>{" "}
                        {debugTargetCondition}
                      </div>
                    )}

                    <ClinicalDischargeReportPanel
                      sections={reportSections}
                      onChange={setReportSections}
                      onConfirm={confirmDiagnosis}
                      confirmDisabled={!isClinicalReportComplete(reportSections)}
                      isAdminExtras={
                        isAdmin ? (
                          <>
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
                                  disabled
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                                    enableAiSurprises
                                      ? "border-[#345884] bg-[#345884]"
                                      : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
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
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                                  forceAiSurprise
                                    ? "border-amber-200 bg-amber-50 text-amber-900"
                                    : "border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                                }`}
                                title="Solo test: forza sempre l'imprevisto quando la diagnosi è corretta"
                              >
                                {forceAiSurprise ? "Forza imprevisto: ON" : "Forza imprevisto: OFF"}
                              </button>
                            </div>
                          </>
                        ) : undefined
                      }
                    />
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
                        {isAdmin && expectedConditionText && (
                          <div className="mt-2 text-[11px] text-rose-700">
                            <span className="font-medium">Patologia corretta:</span>{" "}
                            {expectedConditionText}
                          </div>
                        )}
                      </div>
                    )}
                    {gameStatus === "success" && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[#2F4156]">
                        Diagnosi Corretta! Il paziente è stato trattato con successo ed è in via di dimissione.
                      </div>
                    )}
                    {gameStatus === "complication" && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900">
                        Diagnosi Corretta, MA il paziente ha sviluppato una reazione allergica grave e improvvisa!
                      </div>
                    )}

                    <div className="flex flex-col items-end gap-3">
                      {reportLoading ? (
                        <div className="w-full rounded-2xl border border-zinc-200/80 bg-zinc-50 px-4 py-3">
                          <ReportGenerationProgress
                            progress={reportProgress}
                            message={reportProgressMessage}
                          />
                        </div>
                      ) : null}
                      {reportError ? (
                        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 space-y-2">
                          <p>{reportError}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => void generateReportAndNavigate()}
                            disabled={reportLoading}
                          >
                            Riprova
                          </Button>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-end gap-2">
                      {gameStatus === "complication" ? (
                        <Button
                          type="button"
                          size="md"
                          className="rounded-xl bg-gradient-to-r from-[#1E324E] to-[#345884] px-4 text-xs text-white shadow-sm transition-all duration-300 hover:opacity-95 hover:shadow-md"
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
                              setReportSections({
                                anamnesisObjective: "",
                                diagnosticFindings: "",
                                diagnosisTreatment: "",
                              });
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
                          className="rounded-xl bg-gradient-to-r from-[#1E324E] to-[#345884] px-4 text-xs text-white shadow-sm transition-all duration-300 hover:opacity-95 hover:shadow-md"
                          onClick={() => void generateReportAndNavigate()}
                          disabled={reportLoading}
                        >
                          {reportLoading ? "Generazione report..." : "Vai al Report"}
                        </Button>
                      )}
                    </div>
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
              Base: anagrafica e motivo di accesso. Referto: esame obiettivo di sessione ed esami diagnostici con valori dal caso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-1.5">
            <button
              type="button"
              onClick={() => setPatientChartTab("base")}
              className={
                "rounded-xl border px-3 py-1.5 text-[11px] font-medium transition-colors " +
                (patientChartTab === "base"
                  ? "border-zinc-300 bg-white text-zinc-900 shadow-sm"
                  : "border-transparent text-zinc-600 hover:border-zinc-200/70 hover:bg-white/80")
              }
            >
              Base
            </button>
            <button
              type="button"
              onClick={() => setPatientChartTab("referto")}
              className={
                "rounded-xl border px-3 py-1.5 text-[11px] font-medium transition-colors " +
                (patientChartTab === "referto"
                  ? "border-zinc-300 bg-white text-zinc-900 shadow-sm"
                  : "border-transparent text-zinc-600 hover:border-zinc-200/70 hover:bg-white/80")
              }
            >
              Referto
            </button>
          </div>

          <div className="space-y-4 text-xs min-h-[260px]">
            {patientChartTab === "base" ? (
              <>
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

              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-zinc-700">
                    Esame obiettivo (reperti di sessione)
                  </p>
                  {objectiveFindingsRecentFirst.length === 0 ? (
                    <p className="text-[11px] text-zinc-500">
                      Nessun reperto di esame obiettivo ancora registrato.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {objectiveFindingsRecentFirst.map((exam) => (
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

                <div className="space-y-1.5 border-t border-zinc-200/80 pt-3">
                  <p className="text-[11px] font-medium text-zinc-700">
                    Esami diagnostici richiesti (valori dal caso)
                  </p>
                  {selectedExams.length === 0 ? (
                    <p className="text-[11px] text-zinc-500">
                      Nessun esame ancora richiesto in questa sessione.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {selectedExamsRecentFirst.map((exam) => (
                        <li
                          key={exam.id}
                          className="rounded-xl border border-zinc-200/80 bg-white px-2.5 py-2 text-[11px]"
                        >
                          <p className="text-zinc-800 font-medium">{exam.name}</p>
                          <p className="text-zinc-600 mt-1 whitespace-pre-line">
                            {formatExamFinding(exam.id, examCatalog, caseAdvancedExamValues)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Disclaimer medico-legale</DialogTitle>
            <DialogDescription>
              <p>
                Questa piattaforma è destinata esclusivamente a scopi formativi e di simulazione.
                Le decisioni proposte dall&apos;app, dai modelli di intelligenza artificiale o dai
                contenuti dei casi non sostituiscono in alcun modo il giudizio clinico,
                l&apos;esperienza professionale o le linee guida ufficiali in vigore.
              </p>
              <p className="mt-3">
                Non utilizzare Aequan per prendere decisioni reali su pazienti o situazioni cliniche.
                Qualsiasi uso improprio ricade interamente sotto la responsabilità dell&apos;utente.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-panel-bg px-3.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-ui-bg"
            >
              Torna al dashboard
            </Link>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl text-xs"
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

function getChatMessageText(message: ChatMessageLike): string {
  if (typeof message.content === "string" && message.content.trim()) {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text as string)
      .join("");
  }
  return "";
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
  /** Bound height for embedded Prassi grid — avoids fixed 460px blowing layout. */
  compact?: boolean;
};

function HistoryChat({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  compact = false,
}: HistoryChatProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

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

  const scrollAnchor = visibleMessages
    .map((message) => messageText(message))
    .join("\u0000");

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [scrollAnchor, isLoading]);

  return (
    <div
      className={
        compact
          ? "flex h-[min(420px,52vh)] min-h-[280px] min-w-0 flex-col gap-3 overflow-x-hidden overflow-hidden rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          : "flex h-[460px] min-w-0 flex-col gap-3 overflow-x-hidden overflow-hidden rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
      }
    >
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1.5"
        onWheel={(event) => {
          // Some mouse wheels on Arc do not scroll nested containers reliably.
          if (!scrollRef.current) return;
          scrollRef.current.scrollTop += event.deltaY;
        }}
      >
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
              {isDoctor ? (
                <div className="flex max-w-[78%] items-end gap-2">
                  <div className="rounded-2xl rounded-br-md bg-[#1E324E] p-4 text-sm font-medium leading-relaxed text-white shadow-sm">
                    {text}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2a4266] bg-[#1E324E] shadow-sm">
                    <Stethoscope className="h-4 w-4 text-white/90" />
                  </div>
                </div>
              ) : (
                <div className="flex max-w-[78%] items-end gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 ring-2 ring-white shadow-sm">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-800 shadow-sm">
                    {text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isLoading ? (
          <div className="flex justify-start">
            <div className="flex max-w-[78%] items-end gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 ring-2 ring-white shadow-sm">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <SkeletonChatBubble />
            </div>
          </div>
        ) : null}
      </div>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="mt-1 space-y-1.5"
      >
        <Textarea
          className="rounded-xl border-slate-200 text-xs shadow-sm focus:border-[#345884] focus:ring-2 focus:ring-[#345884]/25 focus-visible:outline-none"
          rows={2}
          placeholder="Formula la prossima domanda o esplora un sintomo (es. caratteristiche del dolore, fattori di rischio, sintomi associati)..."
          value={input}
          onChange={onInputChange}
          onKeyDown={(event) =>
            handleTextareaEnterSubmit(event, {
              getValue: () => input,
              isDisabled: isLoading,
              onSubmit: () => formRef.current?.requestSubmit(),
            })
          }
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-500">
            Invio per inviare · Shift+Invio per andare a capo. L&apos;IA risponde solo come paziente.
          </p>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="rounded-xl bg-gradient-to-r from-[#1E324E] to-[#345884] px-4 py-1.5 text-[11px] text-white shadow-sm transition-all duration-300 hover:opacity-95 hover:shadow-md"
          >
            {isLoading ? "Risposta in corso..." : "Invia domanda"}
          </Button>
        </div>
      </form>
    </div>
  );
}

type ExamsPanelProps = {
  selectedExamIds: string[];
  onToggleExam: (id: string) => void;
  caseExamValues: Record<string, CaseExamStoredValues>;
  examCatalog: Record<string, ExamClinicalMeta>;
  examMacroCatalog: ExamMacroCategory[];
  availableExams: Exam[];
  /** When set, only these macro category ids are shown (e.g. lab / img). */
  macroFilter?: string[];
};

type ExamSelectionCardProps = {
  exam: Exam;
  isSelected: boolean;
  onToggle: (id: string) => void;
  caseExamValues: Record<string, CaseExamStoredValues>;
  examCatalog: Record<string, ExamClinicalMeta>;
  nameNode?: ReactNode;
  className: string;
};

function formatElapsedTime(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const days = Math.floor(safeMinutes / (24 * 60));
  const hours = Math.floor((safeMinutes % (24 * 60)) / 60);
  const minutes = safeMinutes % 60;
  return `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function ExamSelectionCard({
  exam,
  isSelected,
  onToggle,
  caseExamValues,
  examCatalog,
  nameNode,
  className,
}: ExamSelectionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(exam.id)}
      className={className}
    >
      <p className="text-[11px] text-zinc-900">{nameNode ?? exam.name}</p>
      {!isSelected ? (
        <p className="text-[10px] text-zinc-500 mt-0.5">€ {exam.cost} · {exam.timeMinutes} min</p>
      ) : null}
      {isSelected ? (
        <p className="text-[10px] text-emerald-800 mt-1 whitespace-pre-line">
          {formatExamFinding(exam.id, examCatalog, caseExamValues)}
        </p>
      ) : null}
    </button>
  );
}

function ExamsPanel({
  selectedExamIds,
  onToggleExam,
  caseExamValues,
  examCatalog,
  examMacroCatalog,
  availableExams,
  macroFilter,
}: ExamsPanelProps) {
  const macros = useMemo(() => {
    if (!macroFilter?.length) return examMacroCatalog;
    return examMacroCatalog.filter((m) => macroFilter.includes(m.id));
  }, [examMacroCatalog, macroFilter]);

  const [query, setQuery] = useState("");
  const [openMacroId, setOpenMacroId] = useState<string | null>(macros[0]?.id ?? null);
  const [openGroupIds, setOpenGroupIds] = useState<Record<string, string | null>>({});
  const macroVisuals: Record<string, { short: string; icon: ComponentType<{ className?: string }> }> = {
    lab: { short: "Lab", icon: FlaskConical },
    img: { short: "Imaging", icon: ScanLine },
    strum: { short: "Strum", icon: Microscope },
    endo: { short: "Endo", icon: TestTube2 },
  };
  const selectedSet = useMemo(() => new Set(selectedExamIds), [selectedExamIds]);

  useEffect(() => {
    if (!macros.some((m) => m.id === openMacroId)) {
      setOpenMacroId(macros[0]?.id ?? null);
    }
  }, [macros, openMacroId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return availableExams.filter((exam) => exam.name.toLowerCase().includes(q));
  }, [availableExams, query]);

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const normalized = q.trim().toLowerCase();
    const i = text.toLowerCase().indexOf(normalized);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-amber-200/80 rounded px-0.5">{text.slice(i, i + normalized.length)}</mark>
        {text.slice(i + normalized.length)}
      </>
    );
  };

  const toggleGroup = (macroId: string, groupId: string) => {
    setOpenGroupIds((prev) => ({
      ...prev,
      [macroId]: prev[macroId] === groupId ? null : groupId,
    }));
  };

  return (
    <div className="h-[420px]">
      <div className="rounded-2xl bg-white/70 border border-zinc-200/80 p-3 overflow-y-auto text-xs h-full">
        <div className="relative mb-3">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca esami (es. troponina, TC torace, colonscopia...)"
            className="w-full h-9 rounded-xl border border-zinc-200/80 bg-white pl-8 pr-3 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        {query.trim() ? (
          <div className="space-y-1.5">
            {filtered.length === 0 ? (
              <p className="text-zinc-500">Nessun esame trovato.</p>
            ) : (
              filtered.map((exam) => {
                const isSelected = selectedSet.has(exam.id);
                return (
                  <ExamSelectionCard
                    key={exam.id}
                    exam={exam}
                    isSelected={isSelected}
                    onToggle={onToggleExam}
                    caseExamValues={caseExamValues}
                    examCatalog={examCatalog}
                    nameNode={<span className="font-medium">{highlight(exam.name, query)}</span>}
                    className={
                      "w-full text-left rounded-xl border px-3 py-2 transition-colors " +
                      (isSelected
                        ? "border-[#345884]/40 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50")
                    }
                  />
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-1.5">
              {macros.map((macro) => {
                const Icon = macroVisuals[macro.id]?.icon ?? FlaskConical;
                const short = macroVisuals[macro.id]?.short ?? macro.label;
                const active = openMacroId === macro.id;
                return (
                  <button
                    key={`tab-${macro.id}`}
                    type="button"
                    onClick={() => setOpenMacroId(macro.id)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-colors " +
                      (active
                        ? "border-zinc-300 bg-white text-zinc-950 shadow-sm"
                        : "border-transparent bg-transparent text-zinc-600 hover:bg-white/80 hover:border-zinc-200/70")
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {short}
                  </button>
                );
              })}
            </div>
            {macros.filter((macro) => macro.id === openMacroId).map((macro) => (
              <div key={macro.id} className="rounded-2xl border border-zinc-200/80 bg-white p-2 space-y-2">
                {macro.groups.length === 1 ? (
                  <div className="px-1 pb-1 space-y-1.5">
                    {macro.groups[0].exams.map((exam) => {
                      const isSelected = selectedSet.has(exam.id);
                      return (
                        <ExamSelectionCard
                          key={exam.id}
                          exam={exam}
                          isSelected={isSelected}
                          onToggle={onToggleExam}
                          caseExamValues={caseExamValues}
                          examCatalog={examCatalog}
                          className={
                            "w-full text-left rounded-lg border px-2.5 py-2 transition-colors " +
                            (isSelected
                              ? "border-[#345884]/40 bg-slate-50"
                              : "border-slate-200 bg-white hover:bg-slate-50")
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  macro.groups.map((group) => {
                    const groupOpen = openGroupIds[macro.id] === group.id;
                    return (
                      <div key={group.id} className="rounded-xl border border-zinc-200/80 bg-zinc-50/70">
                        <button
                          type="button"
                          onClick={() => toggleGroup(macro.id, group.id)}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-[11px] font-medium text-zinc-800"
                        >
                          <span>{group.label}</span>
                          <span className="text-zinc-500">{groupOpen ? "−" : "+"}</span>
                        </button>
                        {groupOpen ? (
                          <div className="px-2 pb-2 space-y-1.5">
                            {group.exams.map((exam) => {
                              const isSelected = selectedSet.has(exam.id);
                              return (
                                <ExamSelectionCard
                                  key={exam.id}
                                  exam={exam}
                                  isSelected={isSelected}
                                  onToggle={onToggleExam}
                                  caseExamValues={caseExamValues}
                                  examCatalog={examCatalog}
                                  className={
                                    "w-full text-left rounded-lg border px-2.5 py-2 transition-colors " +
                                    (isSelected
                                      ? "border-[#345884]/40 bg-slate-50"
                                      : "border-slate-200 bg-white hover:bg-slate-50")
                                  }
                                />
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-[10px] text-zinc-500">
          Clic su un esame per richiederlo: una volta richiesto non può essere annullato.
        </p>
      </div>
    </div>
  );
}

