"use client";

import { FileText, FlaskConical, Stethoscope } from "lucide-react";
import { cn } from "@/app/utils/cn";

export type ClinicalAction = "prescribe" | "diagnose" | "consult";

type ClinicalActionBarProps = {
  onAction?: (action: ClinicalAction) => void;
  disabled?: boolean;
  className?: string;
};

const ACTIONS: Array<{
  id: ClinicalAction;
  label: string;
  icon: typeof Stethoscope;
}> = [
  { id: "prescribe", label: "Prescrivi Esame (SSN)", icon: FlaskConical },
  { id: "diagnose", label: "Formula Diagnosi", icon: Stethoscope },
  { id: "consult", label: "Richiedi Consulto", icon: FileText },
];

/** Ghost action buttons below the medical chat — brand-primary border. */
export function ClinicalActionBar({ onAction, disabled, className }: ClinicalActionBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 pt-2", className)}>
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onAction?.(id)}
          className={cn(
            "aequan-interactive inline-flex items-center gap-1.5 rounded-aequan border border-brand-primary",
            "bg-transparent px-3 py-1.5 text-xs font-medium text-brand-primary",
            "hover:bg-brand-primary hover:text-white",
            "disabled:opacity-50 disabled:pointer-events-none",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
