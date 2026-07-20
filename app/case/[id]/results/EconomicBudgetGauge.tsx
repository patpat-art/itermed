"use client";

import { cn } from "@/app/utils/cn";

type EconomicBudgetGaugeProps = {
  targetBudget: number;
  actualSpent: number;
  wastedEuro?: number;
  className?: string;
};

export function EconomicBudgetGauge({
  targetBudget,
  actualSpent,
  wastedEuro = 0,
  className,
}: EconomicBudgetGaugeProps) {
  const ratio = targetBudget > 0 ? Math.min(actualSpent / targetBudget, 1.5) : 0;
  const fillPercent = Math.min(100, ratio * 100);
  const isOver = actualSpent > targetBudget;
  const isWarning = ratio > 0.85 && !isOver;

  const fillColor = isOver
    ? "bg-[#C0392B]"
    : isWarning
      ? "bg-[#F39C12]"
      : "bg-[#345884]";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Utilizzo budget esami
          </p>
          <p className="text-2xl font-semibold tracking-tight text-[#2F4156] tabular-nums">
            €{actualSpent.toFixed(0)}
            <span className="text-sm font-normal text-slate-500"> / €{targetBudget.toFixed(0)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500">Efficienza</p>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums",
              isOver ? "text-[#C0392B]" : isWarning ? "text-[#F39C12]" : "text-[#345884]",
            )}
          >
            {targetBudget > 0 ? Math.round((targetBudget / Math.max(actualSpent, 1)) * 100) : 100}%
          </p>
        </div>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-slate-100 bg-slate-100">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
            fillColor,
          )}
          style={{ width: `${fillPercent}%` }}
          role="progressbar"
          aria-valuenow={Math.round(fillPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white border border-slate-200 px-2 py-2">
          <p className="text-[9px] uppercase tracking-wide text-slate-500">Budget ideale</p>
          <p className="text-sm font-semibold text-[#345884] tabular-nums">€{targetBudget.toFixed(0)}</p>
        </div>
        <div
          className={cn(
            "rounded-xl border px-2 py-2",
            isOver ? "bg-rose-50/80 border-rose-200/80" : "bg-white border-slate-200",
          )}
        >
          <p className="text-[9px] uppercase tracking-wide text-slate-500">Speso</p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              isOver ? "text-[#C0392B]" : "text-[#1E324E]",
            )}
          >
            €{actualSpent.toFixed(0)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 px-2 py-2">
          <p className="text-[9px] uppercase tracking-wide text-slate-500">Spreco stimato</p>
          <p className="text-sm font-semibold text-amber-800 tabular-nums">€{wastedEuro.toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}
