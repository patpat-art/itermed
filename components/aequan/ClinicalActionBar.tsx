"use client";

import { FileText, FlaskConical, Stethoscope } from "lucide-react";
import { cn } from "@/app/utils/cn";

export type ClinicalAction = "prescribe" | "diagnose" | "consult";

type ClinicalActionBarProps = {
  onAction?: (action: ClinicalAction) => void;
  disabled?: boolean;
  className?: string;
  /** Compact header variant / square tile grid for mockup right column. */
  variant?: "default" | "header" | "tiles";
};

const ACTIONS: Array<{
  id: ClinicalAction;
  label: string;
  shortLabel: string;
  tileLabel: [string, string];
  icon: typeof Stethoscope;
}> = [
  {
    id: "prescribe",
    label: "Prescrivi Esame",
    shortLabel: "Prescrivi Esame",
    tileLabel: ["Prescrivi", "Esame (SSN)"],
    icon: FlaskConical,
  },
  {
    id: "diagnose",
    label: "Formula Diagnosi",
    shortLabel: "Formula Diagnosi",
    tileLabel: ["Formula", "Diagnosi"],
    icon: Stethoscope,
  },
  {
    id: "consult",
    label: "Richiedi Consulto",
    shortLabel: "Consulto",
    tileLabel: ["Richiedi", "Consulto"],
    icon: FileText,
  },
];

/** Clinical action buttons — brand-primary border / mockup tiles. */
export function ClinicalActionBar({
  onAction,
  disabled,
  className,
  variant = "default",
}: ClinicalActionBarProps) {
  const isHeader = variant === "header";
  const isTiles = variant === "tiles";

  if (isTiles) {
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">Azioni rapide</p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {ACTIONS.map(({ id, tileLabel, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onAction?.(id)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3.5 text-center transition hover:border-[#1E324E]/30 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Icon className="h-5 w-5 text-[#1E324E]" />
              <span className="text-xs font-semibold leading-tight text-slate-800">
                {tileLabel[0]}
                <br />
                {tileLabel[1]}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", !isHeader && "pt-2", className)}>
      {ACTIONS.filter((a) => (isHeader ? a.id !== "consult" : true)).map(
        ({ id, label, shortLabel, icon: Icon }) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onAction?.(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border transition",
              "disabled:pointer-events-none disabled:opacity-50",
              isHeader
                ? "border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                : "aequan-interactive border-brand-primary bg-transparent px-3 py-1.5 text-xs font-medium text-brand-primary hover:bg-brand-primary hover:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {isHeader ? shortLabel : label}
          </button>
        ),
      )}
    </div>
  );
}
