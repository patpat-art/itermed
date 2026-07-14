"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  Loader2,
  Route,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { flattenCatalogExams } from "@/lib/exam-catalog-structure";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";
import { Input } from "@/app/ui/input";
import { Textarea } from "@/app/ui/textarea";
import { Button } from "@/app/ui/button";
import { Badge } from "@/app/ui/badge";
import { cn } from "@/app/utils/cn";

const STEPS = [
  { id: 1, label: "Anagrafica", icon: UserRound },
  { id: 2, label: "Tempi esami", icon: FlaskConical },
  { id: 3, label: "Gold Standard", icon: Route },
  { id: 4, label: "Deterioramento", icon: Activity },
] as const;

const CATALOG_EXAMS = flattenCatalogExams().slice(0, 48);

type WizardForm = {
  title: string;
  description: string;
  specialty: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  age: string;
  sex: "M" | "F" | "";
  context: string;
  pastMedicalHistory: string;
  correctSolution: string;
  vitals_fc: string;
  vitals_pa: string;
  vitals_spo2: string;
  vitals_temp: string;
  vitals_fr: string;
  examLatencies: Record<string, string>;
  goldSteps: string[];
  timeLimitMinutes: string;
  patientDeteriorationThreshold: string;
};

const INITIAL: WizardForm = {
  title: "",
  description: "",
  specialty: "",
  difficulty: "MEDIUM",
  age: "",
  sex: "",
  context: "",
  pastMedicalHistory: "",
  correctSolution: "",
  vitals_fc: "",
  vitals_pa: "",
  vitals_spo2: "",
  vitals_temp: "",
  vitals_fr: "",
  examLatencies: {},
  goldSteps: ["anamnesi_fumo", "obiettivo_torace"],
  timeLimitMinutes: "30",
  patientDeteriorationThreshold: "20",
};

type CaseCreatorWizardProps = {
  canPublishGlobal?: boolean;
};

export function CaseCreatorWizard({ canPublishGlobal = false }: CaseCreatorWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(INITIAL);
  const [isGlobal, setIsGlobal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGoldStep, setNewGoldStep] = useState("");

  const update = useCallback(<K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const configuredExams = useMemo(
    () => Object.entries(form.examLatencies).filter(([, v]) => v.trim() !== ""),
    [form.examLatencies],
  );

  const addGoldStep = () => {
    const v = newGoldStep.trim();
    if (!v) return;
    update("goldSteps", [...form.goldSteps, v]);
    setNewGoldStep("");
  };

  const removeGoldStep = (index: number) => {
    update(
      "goldSteps",
      form.goldSteps.filter((_, i) => i !== index),
    );
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.title.trim()) return "Il titolo è obbligatorio.";
      if (form.description.trim().length < 10) return "La presentazione clinica deve essere più dettagliata.";
    }
    if (s === 3 && form.goldSteps.length === 0) return "Aggiungi almeno una tappa al Gold Standard.";
    if (s === 4) {
      const th = Number(form.patientDeteriorationThreshold);
      if (!Number.isFinite(th) || th < 1) return "Soglia di deterioramento non valida.";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    for (let s = 1; s <= 4; s += 1) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        setStep(s);
        return;
      }
    }

    setSaving(true);
    setError(null);

    const examLatencies: Record<string, number> = {};
    for (const [examId, raw] of Object.entries(form.examLatencies)) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) examLatencies[examId] = Math.round(n);
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      specialty: form.specialty.trim() || null,
      difficulty: form.difficulty,
      pastMedicalHistory: form.pastMedicalHistory.trim() || null,
      correctSolution: form.correctSolution.trim() || null,
      isGlobal: canPublishGlobal && isGlobal,
      demographics: {
        age: form.age.trim() ? form.age.trim() : null,
        sex: form.sex || null,
        context: form.context.trim() || null,
      },
      vitals: {
        heartRate: form.vitals_fc.trim() ? form.vitals_fc.trim() : null,
        bloodPressure: form.vitals_pa.trim() || null,
        spo2: form.vitals_spo2.trim() ? form.vitals_spo2.trim() : null,
        temperature: form.vitals_temp.trim() ? form.vitals_temp.trim() : null,
        respiratoryRate: form.vitals_fr.trim() ? form.vitals_fr.trim() : null,
      },
      timeLimitMinutes: form.timeLimitMinutes.trim() ? Number(form.timeLimitMinutes) : null,
      goldStandardPath: form.goldSteps,
      examLatencies,
      patientDeteriorationThreshold: Number(form.patientDeteriorationThreshold),
    };

    try {
      const res = await fetch("/api/cases/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; id?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Errore durante la creazione del caso.");
        return;
      }
      router.push("/dashboard/cases");
      router.refresh();
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2">
        {STEPS.map(({ id, label, icon: Icon }) => {
          const active = step === id;
          const done = step > id;
          return (
            <div
              key={id}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-sky-300 bg-sky-50 text-sky-900"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-zinc-200 bg-white text-zinc-500",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span>
                {id}. {label}
              </span>
            </div>
          );
        })}
      </nav>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-sky-600" />
              Anagrafica e presentazione clinica
            </CardTitle>
            <CardDescription>
              Definisci il profilo del paziente virtuale e i parametri vitali iniziali.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-zinc-600">Titolo caso</span>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} className="h-9 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Specialità</span>
              <Input value={form.specialty} onChange={(e) => update("specialty", e.target.value)} className="h-9 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Difficoltà</span>
              <select
                value={form.difficulty}
                onChange={(e) => update("difficulty", e.target.value as WizardForm["difficulty"])}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
              >
                <option value="EASY">Facile</option>
                <option value="MEDIUM">Media</option>
                <option value="HARD">Difficile</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Età</span>
              <Input value={form.age} onChange={(e) => update("age", e.target.value)} className="h-9 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Sesso</span>
              <select
                value={form.sex}
                onChange={(e) => update("sex", e.target.value as WizardForm["sex"])}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
              >
                <option value="">—</option>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-zinc-600">Contesto / setting</span>
              <Input value={form.context} onChange={(e) => update("context", e.target.value)} className="h-9 text-sm" placeholder="es. PS notturno, dolore toracico da 2 ore" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-zinc-600">Presentazione clinica</span>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="text-sm" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-zinc-600">Anamnesi / comorbidità</span>
              <Textarea value={form.pastMedicalHistory} onChange={(e) => update("pastMedicalHistory", e.target.value)} rows={2} className="text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">FC (bpm)</span>
              <Input value={form.vitals_fc} onChange={(e) => update("vitals_fc", e.target.value)} className="h-9 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">PA</span>
              <Input value={form.vitals_pa} onChange={(e) => update("vitals_pa", e.target.value)} className="h-9 text-sm" placeholder="120/80" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">SpO₂ (%)</span>
              <Input value={form.vitals_spo2} onChange={(e) => update("vitals_spo2", e.target.value)} className="h-9 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Temperatura (°C)</span>
              <Input value={form.vitals_temp} onChange={(e) => update("vitals_temp", e.target.value)} className="h-9 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">FR (atti/min)</span>
              <Input value={form.vitals_fr} onChange={(e) => update("vitals_fr", e.target.value)} className="h-9 text-sm" />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-zinc-600">Soluzione corretta (nascosta allo studente)</span>
              <Textarea value={form.correctSolution} onChange={(e) => update("correctSolution", e.target.value)} rows={2} className="text-sm" />
            </label>
            {canPublishGlobal ? (
              <label className="flex items-center gap-2 md:col-span-2 text-xs text-zinc-600">
                <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} className="h-3.5 w-3.5" />
                Pubblica come caso globale IterMed
              </label>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Tempi di refertazione esami
            </CardTitle>
            <CardDescription>
              Imposta i minuti di attesa per ogni esame. Il simulatore sommerà queste latenze al tempo trascorso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
            {configuredExams.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pb-2">
                {configuredExams.map(([id, mins]) => (
                  <Badge key={id} variant="info" className="text-[10px]">
                    {id}: {mins} min
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {CATALOG_EXAMS.map((exam) => (
                <label key={exam.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                  <span className="text-[11px] text-zinc-700 truncate" title={exam.name}>
                    {exam.name}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    placeholder="min"
                    value={form.examLatencies[exam.id] ?? ""}
                    onChange={(e) =>
                      update("examLatencies", {
                        ...form.examLatencies,
                        [exam.id]: e.target.value,
                      })
                    }
                    className="h-7 w-16 text-[11px] text-right"
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="h-4 w-4 text-violet-600" />
              Percorso Gold Standard
            </CardTitle>
            <CardDescription>
              Tappe cliniche obbligatorie per superare il caso (es. anamnesi, obiettivo, esami, terapie salvavita).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newGoldStep}
                onChange={(e) => setNewGoldStep(e.target.value)}
                placeholder='es. "rx_torace", "somministrazione_ossigeno"'
                className="h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addGoldStep();
                  }
                }}
              />
              <Button type="button" onClick={addGoldStep} className="h-9 shrink-0">
                Aggiungi
              </Button>
            </div>
            <ol className="space-y-2">
              {form.goldSteps.map((stepId, index) => (
                <li
                  key={`${stepId}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <span>
                    <span className="text-zinc-400 mr-2">{index + 1}.</span>
                    {stepId}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGoldStep(index)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Rimuovi
                  </button>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-600" />
              Soglie di deterioramento
            </CardTitle>
            <CardDescription>
              Dopo quanti minuti simulati, senza azioni salvavita, il paziente inizia a peggiorare.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Tempo massimo simulazione (min)</span>
              <Input
                type="number"
                min={5}
                value={form.timeLimitMinutes}
                onChange={(e) => update("timeLimitMinutes", e.target.value)}
                className="h-9 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Soglia deterioramento (min)</span>
              <Input
                type="number"
                min={1}
                value={form.patientDeteriorationThreshold}
                onChange={(e) => update("patientDeteriorationThreshold", e.target.value)}
                className="h-9 text-sm"
              />
            </label>
            <div className="md:col-span-2 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1">
              <p>
                <strong>Riepilogo:</strong> {form.goldSteps.length} tappe Gold Standard,{" "}
                {configuredExams.length} esami con latenza configurata.
              </p>
              <p>
                Se il tempo simulato supera{" "}
                <strong>{form.patientDeteriorationThreshold || "—"} min</strong> senza completare il percorso,
                l&apos;AI farà deteriorare il paziente (desaturazione, ipotensione, distress).
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || saving} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Indietro
        </Button>
        {step < 4 ? (
          <Button type="button" onClick={goNext} className="gap-1">
            Avanti
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={saving} className="gap-1.5 min-w-[140px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Crea caso
          </Button>
        )}
      </div>
    </div>
  );
}
