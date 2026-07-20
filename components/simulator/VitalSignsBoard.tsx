"use client";

import {
  deriveDemoVitals,
  estimateAgeFromTitle,
  patientDisplayName,
} from "@/lib/prassi/demo-vitals";
import {
  classifyVitals,
  maxVitalStatus,
  vitalStatusLabel,
  type VitalStatus,
} from "@/lib/clinical/vital-status";
import { cn } from "@/app/utils/cn";

type VitalSignsBoardProps = {
  caseId: string;
  title?: string | null;
  age?: number | string | null;
  sex?: string | null;
  stress?: number;
  className?: string;
};

function statusBadgeClass(status: VitalStatus) {
  switch (status) {
    case "critical":
      return "bg-rose-500/90 text-white";
    case "borderline":
      return "bg-amber-400/90 text-slate-900";
    default:
      return "bg-emerald-500/90 text-slate-900";
  }
}

function statusValueClass(status: VitalStatus) {
  switch (status) {
    case "critical":
      return "text-rose-400";
    case "borderline":
      return "text-amber-300";
    default:
      return "text-emerald-400";
  }
}

export function VitalSignsBoard({
  caseId,
  title,
  age,
  sex,
  stress = 0,
  className,
}: VitalSignsBoardProps) {
  const vitals = deriveDemoVitals(caseId, stress);
  const classified = classifyVitals(vitals);
  const overall = maxVitalStatus(classified.map((v) => v.status));
  const resolvedAge = typeof age === "number" ? age : estimateAgeFromTitle(title, Number(age) || 58);
  const name = patientDisplayName(caseId, title, sex);
  const sexLabel = sex === "F" ? "F" : sex === "M" ? "M" : null;

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-xl bg-slate-900 text-white shadow-lg",
        className,
      )}
      role="region"
      aria-label="Monitor multiparametrico parametri vitali"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Monitor multiparametrico
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">
            {name}
            <span className="font-normal text-slate-400">
              {" "}
              · {resolvedAge}a
              {sexLabel ? ` · ${sexLabel}` : ""}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
            statusBadgeClass(overall),
          )}
        >
          {overall === "critical"
            ? "Critico"
            : overall === "borderline"
              ? "Attenzione"
              : "Stabile"}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 p-3">
        {classified.map((vital) => (
          <div
            key={vital.id}
            className="flex min-w-0 flex-col gap-1 overflow-hidden rounded-lg bg-slate-950/50 px-2 py-2"
          >
            <div className="flex min-w-0 items-start justify-between gap-1">
              <span className="truncate text-xs text-slate-400">{vital.label}</span>
              <span
                className={cn(
                  "shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
                  statusBadgeClass(vital.status),
                )}
              >
                {vitalStatusLabel(vital.status)}
              </span>
            </div>
            <p
              className={cn(
                "truncate text-base font-bold tabular-nums leading-tight md:text-lg",
                statusValueClass(vital.status),
              )}
              title={`${vital.value} ${vital.unit}`}
            >
              {vital.value}
            </p>
            <span className="truncate text-[10px] text-slate-500">{vital.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
