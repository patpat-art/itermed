"use client";

import { Activity, HeartPulse, Thermometer } from "lucide-react";
import {
  deriveDemoVitals,
  estimateAgeFromTitle,
  patientDisplayName,
} from "@/lib/prassi/demo-vitals";
import { cn } from "@/app/utils/cn";

type VitalSignsBoardProps = {
  caseId: string;
  title?: string | null;
  age?: number | string | null;
  sex?: string | null;
  stress?: number;
  className?: string;
};

export function VitalSignsBoard({
  caseId,
  title,
  age,
  sex,
  stress = 0,
  className,
}: VitalSignsBoardProps) {
  const vitals = deriveDemoVitals(caseId, stress);
  const resolvedAge = typeof age === "number" ? age : estimateAgeFromTitle(title, Number(age) || 58);
  const name = patientDisplayName(caseId, title);
  const sexLabel = sex === "F" ? "F" : sex === "M" ? "M" : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-slate-900 bg-[#1E324E] p-4 shadow-inner",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#345884]">
          Lavagna parametri vitali
        </p>
        <p className="font-display mt-0.5 truncate text-sm font-semibold text-white">
          Paziente: {name}, {resolvedAge} anni
          {sexLabel ? ` · ${sexLabel === "M" ? "Maschio" : "Femmina"}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs font-medium tabular-nums text-slate-100">
        <span className="inline-flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          PA: {vitals.bp}
        </span>
        <span className="hidden text-slate-700 sm:inline">|</span>
        <span className="inline-flex items-center gap-1.5">
          <HeartPulse className="h-3.5 w-3.5 text-cyan-400" />
          FC: {vitals.hr} bpm
        </span>
        <span className="hidden text-slate-700 sm:inline">|</span>
        <span>SpO₂: {vitals.spo2}%</span>
        <span className="hidden text-slate-700 sm:inline">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
          T: {vitals.temp}°C
        </span>
        <span className="hidden text-slate-700 md:inline">|</span>
        <span className="hidden md:inline">FR: {vitals.rr}/min</span>
      </div>
    </div>
  );
}
