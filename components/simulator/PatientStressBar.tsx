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
      ? "bg-rose-100 border-rose-200/80"
      : tier === "warning"
        ? "bg-amber-100 border-amber-200/80"
        : "bg-emerald-50 border-emerald-200/70";

  const fill =
    tier === "danger"
      ? "bg-gradient-to-r from-rose-500 to-red-600"
      : tier === "warning"
        ? "bg-gradient-to-r from-amber-400 to-orange-500"
        : "bg-gradient-to-r from-emerald-500 to-teal-600";

  const labelClass =
    tier === "danger"
      ? "text-rose-900"
      : tier === "warning"
        ? "text-amber-900"
        : "text-emerald-900";

  return (
    <div className={className ?? ""}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
          <Gauge className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          Stress / urgenza
        </span>
        <span className={`text-[11px] font-semibold tabular-nums ${labelClass}`}>{v}%</span>
      </div>
      <div className={`h-2.5 w-full overflow-hidden rounded-full border ${track}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fill} ${
            tier === "danger" ? "shadow-[0_0_12px_rgba(225,29,72,0.45)]" : ""
          }`}
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
