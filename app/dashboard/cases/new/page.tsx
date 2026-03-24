import { redirect } from "next/navigation";
import { Gauge, Stethoscope, Thermometer, Brain } from "lucide-react";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Button } from "../../../ui/button";

function str(v: FormDataEntryValue | null): string | null {
  return v && typeof v === "string" && v.trim() ? v.trim() : null;
}
function num(v: FormDataEntryValue | null): number | string | null {
  if (!v || typeof v !== "string" || !v.trim()) return null;
  const n = Number(v);
  return Number.isNaN(n) ? v.trim() : n;
}

async function createCase(formData: FormData) {
  "use server";

  const user = await requireUser();
  const title = formData.get("title");
  const description = formData.get("description");
  const specialty = formData.get("specialty");
  const age = formData.get("age");
  const sex = formData.get("sex");
  const context = formData.get("context");
  const difficulty = formData.get("difficulty");
  const pastHistory = formData.get("pastHistory");
  const correctSolution = formData.get("correctSolution");

  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Il titolo del caso è obbligatorio.");
  }
  if (typeof description !== "string" || !description.trim()) {
    throw new Error("La descrizione del caso è obbligatoria.");
  }

  const baselineExamFindings = {
    demographics: {
      age: num(formData.get("age")),
      sex: str(formData.get("sex")),
      context: str(formData.get("context")),
    },
    vitals: {
      heartRate: num(formData.get("vitals_fc")),
      bloodPressure: str(formData.get("vitals_pa")),
      spo2: num(formData.get("vitals_spo2")),
      temperature: num(formData.get("vitals_temp")),
      respiratoryRate: num(formData.get("vitals_fr")),
    },
    thorax: {
      cardiacAuscultation: str(formData.get("thorax_cardiac")),
      lungAuscultation: str(formData.get("thorax_lung")),
    },
    abdomen: {
      inspection: str(formData.get("abdomen_inspection")),
      palpation: str(formData.get("abdomen_palpation")),
      percussion: str(formData.get("abdomen_percussion")),
    },
    neuro: {
      pupils: str(formData.get("neuro_pupils")),
      gcs: str(formData.get("neuro_gcs")),
      deficits: str(formData.get("neuro_deficits")),
    },
  };

  const ageStr = baselineExamFindings.demographics.age != null ? String(baselineExamFindings.demographics.age) : "";
  const sexStr = baselineExamFindings.demographics.sex === "F" ? "Femmina" : baselineExamFindings.demographics.sex === "M" ? "Maschio" : "";
  const ctxStr = baselineExamFindings.demographics.context ?? "";
  const patientPrompt = [ageStr ? `${ageStr} anni` : "", sexStr, ctxStr, description.trim()]
    .filter(Boolean)
    .join(". ") || "Paziente in simulazione. Rispondi come paziente, senza diagnosi.";

  await prisma.clinicalCase.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      specialty:
        typeof specialty === "string" && specialty.trim() ? specialty.trim() : null,
      difficulty:
        difficulty === "EASY" || difficulty === "HARD" || difficulty === "MEDIUM"
          ? difficulty
          : "MEDIUM",
      isActive: true,
      pastMedicalHistory:
        typeof pastHistory === "string" && pastHistory.trim() ? pastHistory.trim() : null,
      correctSolution:
        typeof correctSolution === "string" && correctSolution.trim()
          ? correctSolution.trim()
          : null,
      deckId: null,
      createdById: user.id,
      baselineExamFindings,
      nodes: {
        create: [
          {
            order: 1,
            type: "HISTORY",
            content: { casePrompt: patientPrompt },
          },
        ],
      },
    },
  });

  redirect("/dashboard/decks");
}

export default function NewCasePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Nuovo caso clinico</h1>
        <p className="text-sm text-zinc-400">
          Definisci i dati anagrafici del paziente, la descrizione del caso e i parametri di esame
          obiettivo di base.
        </p>
      </header>

      <Card className="bg-white/80 border-zinc-200/80 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">
            Dati del paziente e del caso
          </CardTitle>
          <CardDescription>
            Queste informazioni saranno usate per alimentare il simulatore e l&apos;esame obiettivo
            interattivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCase} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-700" htmlFor="title">
                  Titolo caso
                </label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Es. Dolore toracico in PS"
                  className="text-xs"
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
                />
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
                <Input
                  id="context"
                  name="context"
                  placeholder="Es. Accesso in PS per dolore toracico"
                  className="text-xs"
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
                  placeholder="Es. diabete mellito tipo 2, ipertensione arteriosa, pregressa PCI..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-[11px] font-medium text-zinc-700"
                  htmlFor="correctSolution"
                >
                  Soluzione corretta del caso (diagnosi e gestione attesa)
                </label>
                <Textarea
                  id="correctSolution"
                  name="correctSolution"
                  rows={3}
                  placeholder="Descrivi in modo sintetico la diagnosi attesa e i passaggi chiave di gestione corretta."
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-zinc-700">Difficoltà</span>
              <div className="flex items-center gap-2">
                {["EASY", "MEDIUM", "HARD"].map((level) => (
                  <label key={level} className="inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      defaultChecked={level === "MEDIUM"}
                      className="h-3 w-3"
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-200/80">
              <p className="text-[11px] font-medium text-zinc-700">
                Esame obiettivo di base (come nel simulatore)
              </p>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                  <Gauge className="h-3.5 w-3.5 text-sky-600" />
                  Parametri vitali
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
                  <Input name="vitals_fc" placeholder="FC" className="h-7 px-2 text-[11px]" />
                  <Input name="vitals_pa" placeholder="PA" className="h-7 px-2 text-[11px]" />
                  <Input name="vitals_spo2" placeholder="SpO₂" className="h-7 px-2 text-[11px]" />
                  <Input name="vitals_temp" placeholder="Temp °C" className="h-7 px-2 text-[11px]" />
                  <Input name="vitals_fr" placeholder="FR" className="h-7 px-2 text-[11px]" />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                  <Stethoscope className="h-3.5 w-3.5 text-sky-600" />
                  Torace
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  <Input
                    name="thorax_cardiac"
                    placeholder="Auscultazione cuore"
                    className="h-7 px-2 text-[11px]"
                  />
                  <Input
                    name="thorax_lung"
                    placeholder="Auscultazione polmoni"
                    className="h-7 px-2 text-[11px]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                  <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                  Addome
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                  <Input
                    name="abdomen_inspection"
                    placeholder="Ispezione"
                    className="h-7 px-2 text-[11px]"
                  />
                  <Input
                    name="abdomen_palpation"
                    placeholder="Palpazione"
                    className="h-7 px-2 text-[11px]"
                  />
                  <Input
                    name="abdomen_percussion"
                    placeholder="Percussione"
                    className="h-7 px-2 text-[11px]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                  <Brain className="h-3.5 w-3.5 text-purple-600" />
                  Neurologico
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                  <Input
                    name="neuro_pupils"
                    placeholder="Pupille"
                    className="h-7 px-2 text-[11px]"
                  />
                  <Input
                    name="neuro_gcs"
                    placeholder="GCS"
                    className="h-7 px-2 text-[11px]"
                  />
                  <Input
                    name="neuro_deficits"
                    placeholder="Deficit focali"
                    className="h-7 px-2 text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                size="sm"
                className="text-xs px-4"
              >
                Crea caso
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

