"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/app/ui/input";
import { ExamRangeBadge } from "@/components/exams/ExamRangeBadge";
import { cn } from "@/app/utils/cn";

export type ExamMetadataClient = {
  id: string;
  name: string;
  category: string;
  unit: string;
  normalRangeMin: number | null;
  normalRangeMax: number | null;
  baseCost: number;
  baseTurnaroundMinutes: number;
  urgencyTiming: string;
  routineTiming: string;
  normalFindingText: string;
};

type ExamAccordionItemProps = {
  exam: ExamMetadataClient;
  forceOpen?: boolean;
  onSave: (id: string, patch: Partial<ExamMetadataClient>) => Promise<void>;
};

export const ExamAccordionItem = memo(function ExamAccordionItem({
  exam,
  forceOpen = false,
  onSave,
}: ExamAccordionItemProps) {
  const [open, setOpen] = useState(forceOpen);
  const [draft, setDraft] = useState(exam);
  const [previewValue, setPreviewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const isOpen = forceOpen || open;

  useEffect(() => {
    setDraft(exam);
  }, [exam]);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const updateField = useCallback(
    <K extends keyof ExamMetadataClient>(field: K, raw: string) => {
      setDraft((prev) => ({
        ...prev,
        [field]:
          field === "baseCost" ||
          field === "baseTurnaroundMinutes" ||
          field === "normalRangeMin" ||
          field === "normalRangeMax"
            ? raw === ""
              ? null
              : Number(raw)
            : raw,
      }));
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(exam.id, draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id={`exam-${exam.id}`}
      className={cn(
        "rounded-xl border bg-white transition-colors",
        isOpen ? "border-sky-200/80 shadow-sm" : "border-zinc-200/80",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-900 truncate">{exam.name}</p>
          <p className="text-[10px] text-zinc-500 truncate">
            {exam.id} · €{exam.baseCost} · {exam.baseTurnaroundMinutes} min
          </p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-zinc-500 shrink-0 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen ? (
        <div className="px-3 pb-3 space-y-3 border-t border-zinc-100 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] font-medium text-zinc-500">Costo (€)</span>
              <Input
                value={String(draft.baseCost)}
                onChange={(e) => updateField("baseCost", e.target.value)}
                className="h-8 text-[11px]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-medium text-zinc-500">Refertazione (min)</span>
              <Input
                value={String(draft.baseTurnaroundMinutes)}
                onChange={(e) => updateField("baseTurnaroundMinutes", e.target.value)}
                className="h-8 text-[11px]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-medium text-zinc-500">Urgenza (label)</span>
              <Input
                value={draft.urgencyTiming}
                onChange={(e) => updateField("urgencyTiming", e.target.value)}
                className="h-8 text-[11px]"
                placeholder="es. 15 min"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-medium text-zinc-500">Routine (label)</span>
              <Input
                value={draft.routineTiming}
                onChange={(e) => updateField("routineTiming", e.target.value)}
                className="h-8 text-[11px]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-medium text-zinc-500">Range min</span>
              <Input
                value={draft.normalRangeMin ?? ""}
                onChange={(e) => updateField("normalRangeMin", e.target.value)}
                className="h-8 text-[11px]"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-medium text-zinc-500">Range max</span>
              <Input
                value={draft.normalRangeMax ?? ""}
                onChange={(e) => updateField("normalRangeMax", e.target.value)}
                className="h-8 text-[11px]"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] font-medium text-zinc-500">Unità</span>
              <Input
                value={draft.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                className="h-8 text-[11px]"
              />
            </label>
          </div>

          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-2.5 space-y-2">
            <p className="text-[10px] font-medium text-zinc-600">Anteprima valore di default</p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={previewValue}
                onChange={(e) => setPreviewValue(e.target.value)}
                placeholder="Inserisci valore numerico di test"
                className="h-8 text-[11px] max-w-[200px]"
              />
              <ExamRangeBadge
                value={previewValue}
                min={draft.normalRangeMin}
                max={draft.normalRangeMax}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1E324E] px-4 text-xs font-medium text-white transition-colors hover:bg-[#2A486D] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Salva esame
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
});
