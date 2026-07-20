"use client";

import { FileText, FlaskConical, Stethoscope } from "lucide-react";
import { cn } from "@/app/utils/cn";

export type ClinicalAction = "prescribe" | "diagnose" | "consult";

type ClinicalActionBarProps = {
  onAction?: (action: ClinicalAction) => void;
  disabled?: boolean;
  className?: string;
  /** Compact header variant for the clinical session top bar. */
  variant?: "default" | "header";
};

const ACTIONS: Array<{
  id: ClinicalAction;
  label: string;
  shortLabel: string;
  icon: typeof Stethoscope;
}> = [
  { id: "prescribe", label: "Prescrivi Esame", shortLabel: "Prescrivi Esame", icon: FlaskConical },
  { id: "diagnose", label: "Formula Diagnosi", shortLabel: "Formula Diagnosi", icon: Stethoscope },
  { id: "consult", label: "Richiedi Consulto", shortLabel: "Consulto", icon: FileText },
];

/** Clinical action buttons — brand-primary border. */
export function ClinicalActionBar({
  onAction,
  disabled,
  className,
  variant = "default",
}: ClinicalActionBarProps) {
  const isHeader = variant === "header";

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
