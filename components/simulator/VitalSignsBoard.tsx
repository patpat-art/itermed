"use client";

import { Activity, HeartPulse, Thermometer, Wind } from "lucide-react";
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

const TILE_ICON: Record<string, typeof Activity> = {
  bp: Activity,
  hr: HeartPulse,
  spo2: Wind,
  temp: Thermometer,
  rr: Wind,
};

function statusClasses(status: VitalStatus) {
  switch (status) {
    case "critical":
      return {
        tile: "border-monitor-critical/50 bg-monitor-critical/10",
        value: "text-monitor-critical",
        badge: "bg-monitor-critical text-white",
        glow: "shadow-[0_0_12px_rgba(192,57,43,0.35)]",
      };
    case "borderline":
      return {
        tile: "border-monitor-warn/45 bg-monitor-warn/10",
        value: "text-monitor-warn",
        badge: "bg-monitor-warn text-[#1a1200]",
        glow: "shadow-[0_0_10px_rgba(243,156,18,0.28)]",
      };
    default:
      return {
        tile: "border-monitor-stable/40 bg-monitor-stable/10",
        value: "text-monitor-stable",
        badge: "bg-monitor-stable text-[#04140c]",
        glow: "",
      };
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
  const overallCfg = statusClasses(overall);
  const resolvedAge = typeof age === "number" ? age : estimateAgeFromTitle(title, Number(age) || 58);
  const name = patientDisplayName(caseId, title);
  const sexLabel = sex === "F" ? "F" : sex === "M" ? "M" : null;

  return (
    <div
      className={cn(
        "overflow-x-hidden overflow-hidden rounded-xl border border-slate-800/80 bg-[#0B1624] shadow-lg",
        className,
      )}
      role="region"
      aria-label="Monitor multiparametrico parametri vitali"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  overall === "critical"
                    ? "bg-monitor-critical"
                    : overall === "borderline"
                      ? "bg-monitor-warn"
                      : "bg-monitor-stable",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  overall === "critical"
                    ? "bg-monitor-critical"
                    : overall === "borderline"
                      ? "bg-monitor-warn"
                      : "bg-monitor-stable",
                )}
              />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Monitor multiparametrico
            </p>
          </div>
          <p className="mt-0.5 truncate font-display text-sm font-semibold text-white">
            {name}
            <span className="font-sans font-normal text-slate-400">
              {" "}
              · {resolvedAge} anni
              {sexLabel ? ` · ${sexLabel === "M" ? "M" : "F"}` : ""}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            overallCfg.badge,
          )}
        >
          {overall === "critical"
            ? "Deterioramento"
            : overall === "borderline"
              ? "Attenzione"
              : "Stabile"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-5">
        {classified.map((vital) => {
          const cfg = statusClasses(vital.status);
          const Icon = TILE_ICON[vital.id] ?? Activity;
          return (
            <div
              key={vital.id}
              className={cn(
                "rounded-xl border px-3 py-2.5 transition-colors",
                cfg.tile,
                cfg.glow,
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <Icon className="h-3 w-3" />
                  {vital.label}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    cfg.badge,
                  )}
                >
                  {vitalStatusLabel(vital.status)}
                </span>
              </div>
              <p
                className={cn(
                  "mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight",
                  cfg.value,
                )}
              >
                {vital.value}
                <span className="ml-1 text-[10px] font-sans font-medium text-slate-500">
                  {vital.unit}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
