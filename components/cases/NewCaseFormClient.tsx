"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Gauge,
  Stethoscope,
  Thermometer,
  Brain,
  FileText,
  FlaskConical,
  Loader2,
  Sparkles,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { EXAM_DEFAULT_VALUES } from "../../lib/exam-default-values";
import type { ExamClinicalMeta } from "../../lib/exam-default-values";
import { CaseFormTabs } from "./CaseFormTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../app/ui/card";
import { Input } from "../../app/ui/input";
import { Textarea } from "../../app/ui/textarea";
import { Button } from "../../app/ui/button";
import { createCase } from "../../app/dashboard/cases/new/actions";

const EXAM_IDS = Object.keys(EXAM_DEFAULT_VALUES);

type AbnormalRow = { id: string; examId: string; value: string };

/** Campi testuali + sex + difficulty controllati per prefill AI (name allineati al form server). */
const CONTROLLED_FIELD_NAMES = [
  "title",
  "specialty",
  "age",
  "context",
  "description",
  "pastHistory",
  "correctSolution",
  "vitals_fc",
  "vitals_pa",
  "vitals_spo2",
  "vitals_temp",
  "vitals_fr",
  "thorax_cardiac",
  "thorax_lung",
  "abdomen_inspection",
  "abdomen_palpation",
  "abdomen_percussion",
  "neuro_pupils",
  "neuro_gcs",
  "neuro_deficits",
] as const;

export function NewCaseFormClient({ roleHint }: { roleHint: string }) {
  const [abnormalRows, setAbnormalRows] = useState<AbnormalRow[]>([]);
  const [mergedExamValues, setMergedExamValues] = useState<Record<string, ExamClinicalMeta> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fieldVal = (name: string) => formFields[name] ?? "";
  const setField = (name: string, value: string) =>
    setFormFields((prev) => ({ ...prev, [name]: value }));

  useEffect(() => {
    if (mergedExamValues) {
      setShowAdvanced(true);
    }
  }, [mergedExamValues]);

  const addAbnormalRow = () => {
    setAbnormalRows((r) => [
      ...r,
      { id: `row-${Date.now()}`, examId: EXAM_IDS[0] ?? "lattati", value: "" },
    ]);
  };

  const updateMergedField = useCallback((examId: string, field: keyof ExamClinicalMeta, value: string | number) => {
    setMergedExamValues((prev) => {
      if (!prev) return prev;
      const cur = prev[examId];
      if (!cur) return prev;
      return {
        ...prev,
        [examId]: {
          ...cur,
          [field]: field === "price" || field === "routineMinutes" ? Number(value) || 0 : value,
        },
      };
    });
  }, []);

  const handleGenerateAI = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAiError(null);
    const form = (e.currentTarget as HTMLElement).closest("form");
    if (!form) return;

    const fd = new FormData(form);
    const age = fd.get("age");
    const sex = fd.get("sex");
    const diagnosis = fd.get("correctSolution");
    const caseDescriptionRaw = fd.get("aiCaseDescription");
    const caseDescription =
      typeof caseDescriptionRaw === "string" ? caseDescriptionRaw.trim() : "";

    const MIN_DESC = 25;
    const hasBrief = caseDescription.length >= MIN_DESC;
    const hasDiagnosis =
      diagnosis && typeof diagnosis === "string" && diagnosis.trim().length > 0;

    if (!hasBrief && !hasDiagnosis) {
      setAiError(
        `Compila la diagnosi / soluzione corretta oppure una descrizione del caso di almeno ${MIN_DESC} caratteri (campo sotto).`,
      );
      return;
    }

    const abnormalExams = abnormalRows
      .filter((row) => row.examId && row.value.trim())
      .map((row) => ({ examId: row.examId, value: row.value.trim() }));

    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: age != null ? String(age) : "",
          sex: sex != null ? String(sex) : "",
          diagnosis: hasDiagnosis ? String(diagnosis).trim() : "",
          caseDescription,
          abnormalExams,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Generazione fallita");
      }
      if (!data.merged || typeof data.merged !== "object") {
        throw new Error("Risposta API non valida");
      }
      setMergedExamValues(data.merged as Record<string, ExamClinicalMeta>);

      const cp = data.caseProfile as
        | {
            title?: string;
            specialty?: string;
            age?: string;
            sex?: string;
            context?: string;
            description?: string;
            pastHistory?: string;
            correctSolution?: string;
            difficulty?: string;
          }
        | null
        | undefined;
      const ob = data.objective as Record<string, string> | null | undefined;

      if (cp && typeof cp === "object") {
        setFormFields((prev) => ({
          ...prev,
          ...(cp.title != null ? { title: String(cp.title) } : {}),
          ...(cp.specialty != null ? { specialty: String(cp.specialty) } : {}),
          ...(cp.age != null ? { age: String(cp.age) } : {}),
          ...(cp.sex === "M" || cp.sex === "F" ? { sex: cp.sex } : {}),
          ...(cp.context != null ? { context: String(cp.context) } : {}),
          ...(cp.description != null ? { description: String(cp.description) } : {}),
          ...(cp.pastHistory != null ? { pastHistory: String(cp.pastHistory) } : {}),
          ...(cp.correctSolution != null ? { correctSolution: String(cp.correctSolution) } : {}),
          ...(cp.difficulty === "EASY" || cp.difficulty === "MEDIUM" || cp.difficulty === "HARD"
            ? { difficulty: cp.difficulty }
            : {}),
        }));
      }
      if (ob && typeof ob === "object") {
        setFormFields((prev) => {
          const next = { ...prev };
          for (const k of CONTROLLED_FIELD_NAMES) {
            if (k in ob && ob[k] != null && String(ob[k]).trim()) {
              next[k] = String(ob[k]);
            }
          }
          return next;
        });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const title = fieldVal("title").trim();
    const desc = fieldVal("description").trim();
    if (!title || !desc) {
      e.preventDefault();
      setSubmitError(
        "Titolo e descrizione del caso sono obbligatori. Usa «Genera profilo completo (AI)» oppure compilali in Impostazioni avanzate.",
      );
      return;
    }
    setSubmitError(null);
  };

  return (
    <Card className="bg-white/80 border-zinc-200/80 max-w-3xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-zinc-950">Nuovo caso clinico</CardTitle>
        <CardDescription>
          Parti dalla descrizione per l&apos;AI: genera tutto il profilo in un clic, poi rivedi o modifica in impostazioni avanzate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createCase} onSubmit={handleFormSubmit} className="space-y-5 text-xs">
          {mergedExamValues ? (
            <input type="hidden" name="mergedAdvancedExams" value={JSON.stringify(mergedExamValues)} />
          ) : null}

          {submitError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800" role="alert">
              {submitError}
            </p>
          ) : null}

          <section className="rounded-2xl border border-violet-200/90 bg-gradient-to-b from-violet-50/90 to-white p-4 sm:p-5 shadow-sm">
            <label className="text-sm font-medium text-violet-950" htmlFor="aiCaseDescription">
              Descrivi il caso all&apos;AI
            </label>
            <p className="mt-1 text-[11px] text-violet-900/80 leading-relaxed">
              Sintomi, contesto, età o sesso se vuoi, sospetto clinico. Con almeno 25 caratteri puoi generare titolo, descrizione, esame obiettivo e referti senza compilare il resto a mano.
            </p>
            <Textarea
              id="aiCaseDescription"
              name="aiCaseDescription"
              rows={14}
              placeholder="Esempio: Uomo 62 anni, ex-fumatore, dolore toracico oppressivo da 90 minuti con nausea e sudorazione; accesso in PS..."
              className="mt-3 text-sm min-h-[200px] bg-white border-violet-200/80 resize-y"
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="text-xs gap-1.5 bg-violet-700 hover:bg-violet-800 text-white"
                disabled={aiLoading}
                onClick={handleGenerateAI}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analisi in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Genera profilo completo (AI)
                  </>
                )}
              </Button>
            </div>
            {aiError ? <p className="mt-2 text-[11px] text-rose-700">{aiError}</p> : null}
            {mergedExamValues ? (
              <p className="mt-2 text-[11px] text-emerald-800">
                Profilo generato. Apri <span className="font-medium">Impostazioni avanzate</span> per controllare o modificare i campi, poi salva.
              </p>
            ) : null}
          </section>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-2.5 text-left text-[11px] font-medium text-zinc-800 hover:bg-zinc-100/90 transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="flex-1">Impostazioni avanzate</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                {showAdvanced ? "Nascondi" : "Titolo, anagrafica, esami manuali, schede dettaglio"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
            </button>

            <div className={showAdvanced ? "space-y-4 pt-1" : "hidden"}>
          <CaseFormTabs
            general={
              <section className="space-y-4">
                <div className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-2.5">
                  <label className="inline-flex items-center gap-2 text-[11px] font-medium text-zinc-700">
                    <input type="checkbox" name="isGlobal" className="h-3.5 w-3.5" />
                    <span>Caso globale (visibile a tutti gli utenti)</span>
                  </label>
                  <p className="mt-1 text-[11px] text-zinc-500">{roleHint}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="title">
                      Titolo caso
                    </label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Es. Dolore toracico in PS"
                      className="text-xs"
                      value={fieldVal("title")}
                      onChange={(e) => setField("title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="specialty">
                      Specialità
                    </label>
                    <Input
                      id="specialty"
                      name="specialty"
                      placeholder="Es. Emergenza / Cardiologia"
                      className="text-xs"
                      value={fieldVal("specialty")}
                      onChange={(e) => setField("specialty", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="age">
                      Età
                    </label>
                    <Input
                      id="age"
                      name="age"
                      placeholder="Es. 58"
                      className="text-xs"
                      value={fieldVal("age")}
                      onChange={(e) => setField("age", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-zinc-700">Sesso</span>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="sex"
                          value="M"
                          className="h-3 w-3"
                          checked={fieldVal("sex") === "M"}
                          onChange={() => setField("sex", "M")}
                        />
                        <span>Maschio</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="sex"
                          value="F"
                          className="h-3 w-3"
                          checked={fieldVal("sex") === "F"}
                          onChange={() => setField("sex", "F")}
                        />
                        <span>Femmina</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="context">
                      Contesto
                    </label>
                    <Input
                      id="context"
                      name="context"
                      placeholder="Es. Accesso in PS per dolore toracico"
                      className="text-xs"
                      value={fieldVal("context")}
                      onChange={(e) => setField("context", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-700" htmlFor="description">
                    Descrizione del caso
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Descrivi in breve il caso clinico, il motivo di accesso e l'obiettivo formativo..."
                    className="text-xs"
                    value={fieldVal("description")}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="pastHistory">
                      Patologie pregresse / comorbilità rilevanti
                    </label>
                    <Textarea
                      id="pastHistory"
                      name="pastHistory"
                      rows={3}
                      placeholder="Es. diabete mellito tipo 2, ipertensione arteriosa..."
                      className="text-xs"
                      value={fieldVal("pastHistory")}
                      onChange={(e) => setField("pastHistory", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="correctSolution">
                      Soluzione corretta del caso (diagnosi e gestione attesa)
                    </label>
                    <Textarea
                      id="correctSolution"
                      name="correctSolution"
                      rows={3}
                      placeholder="Diagnosi attesa e passaggi chiave (usata dall’AI per il profilo esami)."
                      className="text-xs"
                      value={fieldVal("correctSolution")}
                      onChange={(e) => setField("correctSolution", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-zinc-700">Difficoltà</span>
                  <div className="flex items-center gap-2">
                    {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
                      <label key={level} className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="difficulty"
                          value={level}
                          className="h-3 w-3"
                          checked={(fieldVal("difficulty") || "MEDIUM") === level}
                          onChange={() => setField("difficulty", level)}
                        />
                        <span>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <p className="text-[11px] font-medium text-zinc-800">Esami alterati manuali (opzionale)</p>
                  <p className="text-[10px] text-zinc-600">
                    Hanno priorità sui referti in generazione. Usa il pulsante «Genera profilo completo (AI)» nella sezione principale.
                  </p>
                  {abnormalRows.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-end gap-2">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] text-zinc-600">Esame</label>
                        <select
                          className="mt-0.5 w-full h-8 rounded-md border border-zinc-200 bg-white px-2 text-[11px]"
                          value={row.examId}
                          onChange={(e) =>
                            setAbnormalRows((rows) =>
                              rows.map((r) => (r.id === row.id ? { ...r, examId: e.target.value } : r)),
                            )
                          }
                        >
                          {EXAM_IDS.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-[2] min-w-[180px]">
                        <label className="text-[10px] text-zinc-600">Valore alterato (con unità)</label>
                        <Input
                          className="h-8 text-[11px] mt-0.5"
                          value={row.value}
                          onChange={(e) =>
                            setAbnormalRows((rows) =>
                              rows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)),
                            )
                          }
                          placeholder="es. Troponina 850 ng/L"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-8"
                        onClick={() => setAbnormalRows((rows) => rows.filter((r) => r.id !== row.id))}
                      >
                        Rimuovi
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="text-[11px]" onClick={addAbnormalRow}>
                    + Aggiungi esame alterato
                  </Button>
                </div>
              </section>
            }
            objective={
              <section className="space-y-3 pt-2 border-t border-zinc-200/80">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                  <FileText className="h-3.5 w-3.5 text-zinc-600" />
                  Esame obiettivo (accordion)
                </p>

                <details open className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-700">Parametri vitali</summary>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Gauge className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
                    <Input
                      name="vitals_fc"
                      placeholder="FC"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("vitals_fc")}
                      onChange={(e) => setField("vitals_fc", e.target.value)}
                    />
                    <Input
                      name="vitals_pa"
                      placeholder="PA"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("vitals_pa")}
                      onChange={(e) => setField("vitals_pa", e.target.value)}
                    />
                    <Input
                      name="vitals_spo2"
                      placeholder="SpO₂"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("vitals_spo2")}
                      onChange={(e) => setField("vitals_spo2", e.target.value)}
                    />
                    <Input
                      name="vitals_temp"
                      placeholder="Temp °C"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("vitals_temp")}
                      onChange={(e) => setField("vitals_temp", e.target.value)}
                    />
                    <Input
                      name="vitals_fr"
                      placeholder="FR"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("vitals_fr")}
                      onChange={(e) => setField("vitals_fr", e.target.value)}
                    />
                  </div>
                </details>

                <details open className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-700">Torace</summary>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    <Input
                      name="thorax_cardiac"
                      placeholder="Auscultazione cuore"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("thorax_cardiac")}
                      onChange={(e) => setField("thorax_cardiac", e.target.value)}
                    />
                    <Input
                      name="thorax_lung"
                      placeholder="Auscultazione polmoni"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("thorax_lung")}
                      onChange={(e) => setField("thorax_lung", e.target.value)}
                    />
                  </div>
                </details>

                <details open className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-700">Addome</summary>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <Input
                      name="abdomen_inspection"
                      placeholder="Ispezione"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("abdomen_inspection")}
                      onChange={(e) => setField("abdomen_inspection", e.target.value)}
                    />
                    <Input
                      name="abdomen_palpation"
                      placeholder="Palpazione"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("abdomen_palpation")}
                      onChange={(e) => setField("abdomen_palpation", e.target.value)}
                    />
                    <Input
                      name="abdomen_percussion"
                      placeholder="Percussione"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("abdomen_percussion")}
                      onChange={(e) => setField("abdomen_percussion", e.target.value)}
                    />
                  </div>
                </details>

                <details open className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-700">Neurologico</summary>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Brain className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <Input
                      name="neuro_pupils"
                      placeholder="Pupille"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("neuro_pupils")}
                      onChange={(e) => setField("neuro_pupils", e.target.value)}
                    />
                    <Input
                      name="neuro_gcs"
                      placeholder="GCS"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("neuro_gcs")}
                      onChange={(e) => setField("neuro_gcs", e.target.value)}
                    />
                    <Input
                      name="neuro_deficits"
                      placeholder="Deficit focali"
                      className="h-7 px-2 text-[11px]"
                      value={fieldVal("neuro_deficits")}
                      onChange={(e) => setField("neuro_deficits", e.target.value)}
                    />
                  </div>
                </details>
              </section>
            }
            advanced={
              <section className="space-y-2 border-t border-zinc-200/80 pt-3">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                  <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
                  Esami diagnostici avanzati (profilo completo)
                </p>
                {!mergedExamValues ? (
                  <p className="text-[11px] text-zinc-500 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4">
                    Dopo «Genera profilo completo (AI)» nella pagina principale compariranno qui i referti modificabili. Senza AI, al salvataggio
                    verranno usati valori casuali nel range standard per i campi vuoti.
                  </p>
                ) : (
                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2 max-h-[520px] overflow-y-auto">
                    {Object.entries(mergedExamValues).map(([examId, exam]) => (
                      <details key={examId} className="rounded-xl border border-zinc-200/80 bg-white p-2">
                        <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-800">{examId}</summary>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-zinc-500">Prezzo (€)</label>
                            <Input
                              className="h-8 text-[11px] mt-0.5"
                              value={String(exam.price)}
                              onChange={(e) => updateMergedField(examId, "price", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500">Tempo d&apos;urgenza</label>
                            <Input
                              className="h-8 text-[11px] mt-0.5"
                              value={exam.urgencyTiming}
                              onChange={(e) => updateMergedField(examId, "urgencyTiming", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500">Tempo richiesto</label>
                            <Input
                              className="h-8 text-[11px] mt-0.5"
                              value={exam.routineTiming}
                              onChange={(e) => updateMergedField(examId, "routineTiming", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500">Minuti routine</label>
                            <Input
                              className="h-8 text-[11px] mt-0.5"
                              value={String(exam.routineMinutes)}
                              onChange={(e) => updateMergedField(examId, "routineMinutes", e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[10px] text-zinc-500">Valore / referto (laboratorio)</label>
                            <Textarea
                              className="text-[11px] mt-0.5 min-h-[52px]"
                              value={exam.normalFinding}
                              onChange={(e) => updateMergedField(examId, "normalFinding", e.target.value)}
                            />
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                <Textarea name="advanced_exams_notes" rows={5} className="text-xs" placeholder="Note aggiuntive esami avanzati." />
              </section>
            }
          />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-zinc-200/80">
            <Button type="submit" size="sm" className="text-xs px-6 w-full sm:w-auto">
              Crea caso
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
