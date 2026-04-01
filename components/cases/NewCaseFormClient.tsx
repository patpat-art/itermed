"use client";

import { useCallback, useState } from "react";
import { Gauge, Stethoscope, Thermometer, Brain, FileText, FlaskConical, Loader2, Sparkles } from "lucide-react";
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

export function NewCaseFormClient({ roleHint }: { roleHint: string }) {
  const [abnormalRows, setAbnormalRows] = useState<AbnormalRow[]>([]);
  const [mergedExamValues, setMergedExamValues] = useState<Record<string, ExamClinicalMeta> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 border-zinc-200/80 max-w-3xl">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-950">Dati del paziente e del caso</CardTitle>
        <CardDescription>
          Queste informazioni saranno usate per alimentare il simulatore e l&apos;esame obiettivo interattivo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createCase} className="space-y-4 text-xs">
          {mergedExamValues ? (
            <input type="hidden" name="mergedAdvancedExams" value={JSON.stringify(mergedExamValues)} />
          ) : null}

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
                    <Input id="title" name="title" required placeholder="Es. Dolore toracico in PS" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="specialty">
                      Specialità
                    </label>
                    <Input id="specialty" name="specialty" placeholder="Es. Emergenza / Cardiologia" className="text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="age">
                      Età
                    </label>
                    <Input id="age" name="age" placeholder="Es. 58" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-zinc-700">Sesso</span>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5">
                        <input type="radio" name="sex" value="M" className="h-3 w-3" />
                        <span>Maschio</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input type="radio" name="sex" value="F" className="h-3 w-3" />
                        <span>Femmina</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-700" htmlFor="context">
                      Contesto
                    </label>
                    <Input id="context" name="context" placeholder="Es. Accesso in PS per dolore toracico" className="text-xs" />
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
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-zinc-700">Difficoltà</span>
                  <div className="flex items-center gap-2">
                    {["EASY", "MEDIUM", "HARD"].map((level) => (
                      <label key={level} className="inline-flex items-center gap-1.5">
                        <input type="radio" name="difficulty" value={level} defaultChecked={level === "MEDIUM"} className="h-3 w-3" />
                        <span>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-200/80 bg-violet-50/50 p-3 space-y-2">
                  <p className="text-[11px] font-medium text-violet-900">Generazione profilo completo (AI)</p>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-violet-950" htmlFor="aiCaseDescription">
                      Descrizione libera del caso (opzionale ma consigliata)
                    </label>
                    <Textarea
                      id="aiCaseDescription"
                      name="aiCaseDescription"
                      rows={5}
                      placeholder="Descrivi qui il quadro clinico: sintomi, contesto, età/sesso se vuoi, sospetti o evoluzione. Se scrivi almeno 25 caratteri, l&apos;AI può generare tutto il profilo esami senza che tu abbia già compilato la diagnosi o gli esami alterati sotto."
                      className="text-xs bg-white border-violet-200/80"
                    />
                    <p className="text-[10px] text-violet-800/90">
                      Con una descrizione sufficiente, il pulsante &quot;Genera Profilo Completo&quot; interpreta il caso e imposta i referti coerenti. Puoi comunque aggiungere esami alterati manualmente: avranno priorità. Età e sesso dalla scheda sopra, se presenti, vengono inviati all&apos;AI.
                    </p>
                  </div>
                  <p className="text-[11px] font-medium text-violet-900 pt-2 border-t border-violet-200/60">
                    Esami alterati manuali (solo patologici / chiave)
                  </p>
                  <p className="text-[10px] text-violet-800/90">
                    Opzionale: aggiungi solo gli esami con valori fuori norma. L&apos;AI li integrerà con il resto.
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
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" className="text-[11px]" onClick={addAbnormalRow}>
                      + Aggiungi esame alterato
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="text-[11px] gap-1.5 bg-violet-700 hover:bg-violet-800 text-white"
                      disabled={aiLoading}
                      onClick={handleGenerateAI}
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Analisi clinica in corso...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Genera Profilo Completo (AI)
                        </>
                      )}
                    </Button>
                  </div>
                  {aiError ? <p className="text-[11px] text-rose-700">{aiError}</p> : null}
                  {mergedExamValues ? (
                    <p className="text-[11px] text-emerald-800">
                      Profilo generato. Controlla la scheda &quot;Esami avanzati&quot; e modifica se necessario prima di salvare.
                    </p>
                  ) : null}
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
                    <Input name="vitals_fc" placeholder="FC" className="h-7 px-2 text-[11px]" />
                    <Input name="vitals_pa" placeholder="PA" className="h-7 px-2 text-[11px]" />
                    <Input name="vitals_spo2" placeholder="SpO₂" className="h-7 px-2 text-[11px]" />
                    <Input name="vitals_temp" placeholder="Temp °C" className="h-7 px-2 text-[11px]" />
                    <Input name="vitals_fr" placeholder="FR" className="h-7 px-2 text-[11px]" />
                  </div>
                </details>

                <details open className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-700">Torace</summary>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    <Input name="thorax_cardiac" placeholder="Auscultazione cuore" className="h-7 px-2 text-[11px]" />
                    <Input name="thorax_lung" placeholder="Auscultazione polmoni" className="h-7 px-2 text-[11px]" />
                  </div>
                </details>

                <details open className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-700">Addome</summary>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <Input name="abdomen_inspection" placeholder="Ispezione" className="h-7 px-2 text-[11px]" />
                    <Input name="abdomen_palpation" placeholder="Palpazione" className="h-7 px-2 text-[11px]" />
                    <Input name="abdomen_percussion" placeholder="Percussione" className="h-7 px-2 text-[11px]" />
                  </div>
                </details>

                <details open className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                  <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-700">Neurologico</summary>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Brain className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <Input name="neuro_pupils" placeholder="Pupille" className="h-7 px-2 text-[11px]" />
                    <Input name="neuro_gcs" placeholder="GCS" className="h-7 px-2 text-[11px]" />
                    <Input name="neuro_deficits" placeholder="Deficit focali" className="h-7 px-2 text-[11px]" />
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
                    Compila la diagnosi e, se vuoi, gli esami alterati nella scheda &quot;Generali&quot;, poi clicca &quot;Genera Profilo Completo
                    (AI)&quot;. In alternativa puoi salvare senza AI: verranno usati valori casuali nel range standard per i campi vuoti.
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

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="submit" size="sm" className="text-xs px-4">
              Crea caso
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
