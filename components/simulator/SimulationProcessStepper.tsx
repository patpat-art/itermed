"use client";

import { Check } from "lucide-react";
import { cn } from "@/app/utils/cn";

const STEPS = [
  { id: 1, label: "Ingresso" },
  { id: 2, label: "Anamnesi" },
  { id: 3, label: "Es. Obiettivo" },
  { id: 4, label: "Esami" },
  { id: 5, label: "Diagnosi" },
  { id: 6, label: "Conclusione" },
] as const;

type SimulationProcessStepperProps = {
  activeStep: number;
  stepTimes?: Record<number, string>;
  className?: string;
};

export function SimulationProcessStepper({
  activeStep,
  stepTimes = {},
  className,
}: SimulationProcessStepperProps) {
  return (
    <nav
      className={cn(
        "scrollbar-aequan flex w-full min-w-0 items-start gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm",
        className,
      )}
      aria-label="Fasi del caso"
    >
      {STEPS.map((step, index) => {
        const done = step.id < activeStep;
        const active = step.id === activeStep;
        const timeLabel = stepTimes[step.id] ?? (done || active ? "" : "—");
        return (
          <div key={step.id} className="flex min-w-0 flex-1 items-start gap-1">
            <div className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  done && "bg-[#1E324E] text-white",
                  active && "bg-[#1E324E] text-white",
                  !done && !active && "border-2 border-slate-200 bg-white text-slate-400",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span
                className={cn(
                  "hidden max-w-full truncate text-xs font-semibold sm:block",
                  active ? "text-[#1E324E]" : done ? "text-slate-700" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
              <span className="hidden font-mono text-xs tabular-nums text-slate-400 sm:block">
                {timeLabel || "\u00A0"}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mt-4 h-0.5 min-w-3 flex-1 rounded-full",
                  step.id < activeStep ? "bg-[#1E324E]" : "bg-slate-200",
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
