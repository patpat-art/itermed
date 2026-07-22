"use client";

import { BookOpen, FileText, Scale } from "lucide-react";
import { Button } from "@/app/ui/button";
import { Textarea } from "@/app/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/ui/accordion";
import { handleTextareaEnterSubmit } from "@/lib/hooks/textarea-submit";

export type ClinicalReportSections = {
  anamnesisObjective: string;
  diagnosticFindings: string;
  diagnosisTreatment: string;
};

export function composeClinicalReport(sections: ClinicalReportSections): string {
  const parts: string[] = [];

  if (sections.anamnesisObjective.trim()) {
    parts.push("=== ANAMNESI & ESAME OBIETTIVO ===", sections.anamnesisObjective.trim());
  }
  if (sections.diagnosticFindings.trim()) {
    parts.push("=== RISCONTRI DIAGNOSTICI ===", sections.diagnosticFindings.trim());
  }
  if (sections.diagnosisTreatment.trim()) {
    parts.push("=== DIAGNOSI & TRATTAMENTO DI DIMISSIONE ===", sections.diagnosisTreatment.trim());
  }

  return parts.join("\n\n");
}

/** Estrae la diagnosi finale dalla sezione di dimissione per il semantic aligner. */
export function extractFinalDiagnosisFromReport(sections: ClinicalReportSections): string {
  const block = sections.diagnosisTreatment.trim();
  if (!block) return "";

  const labeled = block.match(/(?:diagnosi\s*(?:finale|di\s*dimissione)?)\s*[:\-]\s*(.+)/i);
  if (labeled?.[1]) return labeled[1].split("\n")[0].trim();

  const firstLine = block.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  return firstLine ?? "";
}

export function isClinicalReportComplete(sections: ClinicalReportSections): boolean {
  return (
    sections.anamnesisObjective.trim().length >= 20 &&
    sections.diagnosticFindings.trim().length >= 15 &&
    sections.diagnosisTreatment.trim().length >= 10
  );
}

type ClinicalDischargeReportPanelProps = {
  sections: ClinicalReportSections;
  onChange: (sections: ClinicalReportSections) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  isAdminExtras?: React.ReactNode;
};

export function ClinicalDischargeReportPanel({
  sections,
  onChange,
  onConfirm,
  confirmDisabled,
  isAdminExtras,
}: ClinicalDischargeReportPanelProps) {
  const update = (key: keyof ClinicalReportSections, value: string) => {
    onChange({ ...sections, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#1E324E]/15 bg-gradient-to-br from-[#1E324E]/[0.04] to-white px-3 py-2.5">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-[#1E324E] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-[#1E324E]">
              Stilazione del Referto di Dimissione / Trasferimento
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              Compila un referto clinico strutturato secondo gli standard di Pronto Soccorso e tutela medico-legale.
            </p>
          </div>
        </div>
      </div>

      <Accordion>
        <AccordionItem value="report-guide">
          <AccordionTrigger value="report-guide">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-sky-600" />
              Guida Scientifica e Requisiti Medico-Legali del Referto
            </span>
          </AccordionTrigger>
          <AccordionContent value="report-guide">
            <div className="space-y-3 text-[11px] leading-relaxed text-zinc-700">
              <p>
                <strong>Standard di eccellenza (Pedagogia Medica):</strong> il referto di dimissione/trasferimento
                documenta in modo cronologico e logicamente coerente il percorso diagnostico-terapeutico,
                dalla presentazione in PS alla decisione finale, con linguaggio tecnico ma comprensibile.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Anamnesi &amp; Obiettivo:</strong> motivo di accesso, sintomi con cronologia, fattori di
                  rischio, terapie domiciliari, esame obiettivo mirato con parametri vitali.
                </li>
                <li>
                  <strong>Riscontri Diagnostici:</strong> esami laboratoristici/strumentali con interpretazione
                  sintetica e correlazione clinica (non elenco asettico).
                </li>
                <li>
                  <strong>Diagnosi &amp; Trattamento:</strong> diagnosi finale motivata, terapia effettuata in PS,
                  indicazioni di dimissione/trasferimento, follow-up e red flags da ritorno.
                </li>
              </ul>
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 space-y-1">
                <p className="inline-flex items-center gap-1.5 font-semibold text-amber-950">
                  <Scale className="h-3.5 w-3.5" />
                  Requisiti medico-legali obbligatori
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-950/90">
                  <li>
                    <strong>Art. 476–479 c.p. (pubblica fede):</strong> il referto ha valore probatorio; ogni
                    affermazione deve essere verificabile e non contraddittoria con la cartella.
                  </li>
                  <li>
                    <strong>Chiarezza e cronologia:</strong> sequenza temporale degli eventi, decisioni motivate,
                    nesso logico tra sintomo → indagine → diagnosi → terapia.
                  </li>
                  <li>
                    <strong>Nesso di causalità:</strong> esplicitare il ragionamento clinico che collega i dati
                    alla conclusione diagnostica (rilevanza in sede medico-legale).
                  </li>
                  <li>
                    <strong>Legge Gelli-Bianco (L. 24/2017, art. 5):</strong> aderenza alle Linee Guida SNLG e
                    documentazione di consenso/informazione ove applicabile.
                  </li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3">
        <ReportSectionField
          label="1. Anamnesi & Esame Obiettivo"
          placeholder="Motivo di accesso, anamnesi prossima e remota, terapie, esame obiettivo con parametri vitali..."
          value={sections.anamnesisObjective}
          onChange={(v) => update("anamnesisObjective", v)}
          minRows={4}
        />
        <ReportSectionField
          label="2. Riscontri Diagnostici"
          placeholder="Esami laboratoristici e strumentali con interpretazione clinica sintetica..."
          value={sections.diagnosticFindings}
          onChange={(v) => update("diagnosticFindings", v)}
          minRows={4}
        />
        <ReportSectionField
          label="3. Diagnosi & Trattamento di Dimissione"
          placeholder="Diagnosi finale: ... Terapia in PS, indicazioni di dimissione/trasferimento, follow-up..."
          value={sections.diagnosisTreatment}
          onChange={(v) => update("diagnosisTreatment", v)}
          minRows={5}
          onEnterSubmit={onConfirm}
          submitDisabled={confirmDisabled}
        />
      </div>

      {isAdminExtras}

      <Button
        type="button"
        size="lg"
        className="w-full justify-center text-sm"
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        Conferma Referto Clinico
      </Button>
    </div>
  );
}

function ReportSectionField({
  label,
  placeholder,
  value,
  onChange,
  minRows,
  onEnterSubmit,
  submitDisabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  minRows: number;
  onEnterSubmit?: () => void;
  submitDisabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-zinc-700">{label}</label>
      <Textarea
        className="min-h-20 text-xs bg-white"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        onKeyDown={
          onEnterSubmit
            ? (event) =>
                handleTextareaEnterSubmit(event, {
                  getValue: () => value,
                  isDisabled: Boolean(submitDisabled),
                  onSubmit: onEnterSubmit,
                })
            : undefined
        }
      />
    </div>
  );
}
