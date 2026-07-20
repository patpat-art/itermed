"use client";

import { AlertTriangle, Gauge } from "lucide-react";

type PatientStressBarProps = {
  value: number;
  className?: string;
};

/** Barra 0–100: stile calmo sotto 50%, warning 50–79%, pericolo ≥80%. */
export function PatientStressBar({ value, className }: PatientStressBarProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const tier = v >= 80 ? "danger" : v >= 50 ? "warning" : "calm";

  const track =
    tier === "danger"
      ? "border-rose-700/30 bg-rose-950/10 shadow-inner"
      : tier === "warning"
        ? "border-amber-300/60 bg-amber-50 shadow-inner"
        : "border-slate-200 bg-slate-100 shadow-inner";

  const fill =
    tier === "danger"
      ? "bg-rose-600"
      : tier === "warning"
        ? "animate-[pulse_2.8s_ease-in-out_infinite] bg-amber-500"
        : "bg-[#345884]";

  const labelClass =
    tier === "danger"
      ? "text-rose-700"
      : tier === "warning"
        ? "text-amber-800"
        : "text-[#2F4156]";

  return (
    <div className={className ?? ""}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
          <Gauge className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          Stress / urgenza
        </span>
        <span className={`text-[11px] font-semibold tabular-nums ${labelClass}`}>{v}%</span>
      </div>
      <div className={`h-2.5 w-full overflow-hidden rounded-full border shadow-inner ${track}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fill}`}
          style={{ width: `${v}%` }}
          role="progressbar"
          aria-valuenow={v}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Stress paziente ${v} percento`}
        />
      </div>
      {tier !== "calm" && (
        <p
          className={`mt-1.5 inline-flex items-center gap-1 text-[10px] ${
            tier === "danger" ? "text-rose-700" : "text-amber-800"
          }`}
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {tier === "danger"
            ? "Situazione critica: il paziente è molto instabile."
            : "Attenzione: pressione temporale e disagio in aumento."}
        </p>
      )}
    </div>
  );
}
