"use client";

import { useState } from "react";
import { Activity, Brain, Stethoscope, UserRound } from "lucide-react";
import { Button } from "../../app/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../app/ui/tabs";

type ExamResult = {
  finding: string;
  numericValue: number | null;
};

type ExamState = {
  loading: boolean;
  result?: ExamResult;
};

type PhysicalExamTabProps = {
  sessionId?: string;
  patientPrompt: string;
  caseId?: string;
  onExamResult?: (payload: { id: string; label: string; result: ExamResult }) => void;
};

/** Systemic findings only — vitals live exclusively on the Multiparameter Monitor. */
const generalExams = [
  { id: "general-appearance", label: "Esame obiettivo generale" },
  { id: "skin-mucosa", label: "Cute e mucose" },
  { id: "cardiovascular", label: "Apparato cardiovascolare" },
];

const thoraxExams = [
  { id: "cardiac-auscultation", label: "Auscultazione cuore" },
  { id: "lung-auscultation", label: "Auscultazione polmoni" },
];

const abdomenExams = [
  { id: "abdomen-inspection", label: "Ispezione addome" },
  { id: "abdomen-palpation", label: "Palpazione addome" },
  { id: "abdomen-percussion", label: "Percussione addome" },
];

const neuroExams = [
  { id: "pupils", label: "Pupille" },
  { id: "gcs", label: "Glasgow Coma Scale (GCS)" },
  { id: "neuro-deficits", label: "Deficit focali" },
];

type ExamSection = "general" | "thorax" | "abdomen" | "neuro";

export function PhysicalExamTab({ sessionId, patientPrompt, caseId, onExamResult }: PhysicalExamTabProps) {
  const [exams, setExams] = useState<Record<string, ExamState>>({});
  const [activeSection, setActiveSection] = useState<ExamSection>("general");

  const runExam = async (id: string, label: string) => {
    if (exams[id]?.loading) return;

    setExams((prev) => ({
      ...prev,
      [id]: { ...prev[id], loading: true },
    }));

    try {
      const res = await fetch("/api/examine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          caseId,
          examId: id,
          examType: label,
          patientPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error("Errore nell'esecuzione dell'esame.");
      }

      const data = (await res.json()) as ExamResult;

      setExams((prev) => ({
        ...prev,
        [id]: { loading: false, result: data },
      }));

      if (onExamResult) {
        onExamResult({ id, label, result: data });
      }
    } catch (err) {
      console.error(err);
      setExams((prev) => ({
        ...prev,
        [id]: { loading: false, result: prev[id]?.result },
      }));
    }
  };

  const renderExamButton = (exam: { id: string; label: string }) => {
    const state = exams[exam.id];
    const isLoading = state?.loading;
    const result = state?.result;

    return (
      <div key={exam.id} className="space-y-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between text-[11px]"
          disabled={isLoading}
          onClick={() => runExam(exam.id, exam.label)}
        >
          <span>{exam.label}</span>
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
              <Activity className="w-3 h-3 animate-spin" />
              In corso...
            </span>
          )}
        </Button>
        {result && (
          <div className="text-[11px] text-zinc-600 bg-zinc-50/80 border border-zinc-200/80 rounded-xl px-2.5 py-1.5">
            <span className="font-medium text-zinc-800">{result.finding}</span>
            {typeof result.numericValue === "number" && (
              <span className="ml-1 text-zinc-500">({result.numericValue})</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[420px] flex-col gap-3 overflow-y-auto overflow-x-hidden rounded-2xl border border-zinc-200/80 bg-white/80 p-3 text-xs scrollbar-aequan">
      <p className="text-[11px] leading-relaxed text-slate-500">
        I parametri vitali (PA, FC, SpO₂, T, FR) sono sul Monitor multiparametrico. Qui registra i
        reperti sistemici dell&apos;esame obiettivo.
      </p>
      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as ExamSection)}>
        <TabsList wrap className="w-full">
          <TabsTrigger
            value="general"
            currentValue={activeSection}
            onSelect={(value) => setActiveSection(value as ExamSection)}
            className="shrink-0 whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-sky-600" />
              Generale
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="thorax"
            currentValue={activeSection}
            onSelect={(value) => setActiveSection(value as ExamSection)}
            className="shrink-0 whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
              Torace
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="abdomen"
            currentValue={activeSection}
            onSelect={(value) => setActiveSection(value as ExamSection)}
            className="shrink-0 whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-amber-600" />
              Addome
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="neuro"
            currentValue={activeSection}
            onSelect={(value) => setActiveSection(value as ExamSection)}
            className="shrink-0 whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-[#345884]" />
              Neuro
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" currentValue={activeSection} className="mt-1">
          <div className="space-y-1.5">{generalExams.map(renderExamButton)}</div>
        </TabsContent>
        <TabsContent value="thorax" currentValue={activeSection} className="mt-1">
          <div className="space-y-1.5">{thoraxExams.map(renderExamButton)}</div>
        </TabsContent>
        <TabsContent value="abdomen" currentValue={activeSection} className="mt-1">
          <div className="space-y-1.5">{abdomenExams.map(renderExamButton)}</div>
        </TabsContent>
        <TabsContent value="neuro" currentValue={activeSection} className="mt-1">
          <div className="space-y-1.5">{neuroExams.map(renderExamButton)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
