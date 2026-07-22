"use client";

import { Lightbulb } from "lucide-react";
import { cn } from "@/app/utils/cn";

type LiveCoachingPanelProps = {
  score: number;
  metrics: Array<{ label: string; value: number; tone?: "good" | "warn" | "risk" }>;
  tip?: string;
  className?: string;
};

function barColor(tone: "good" | "warn" | "risk" = "good") {
  if (tone === "risk") return "bg-rose-500";
  if (tone === "warn") return "bg-amber-400";
  return "bg-emerald-500";
}

export function LiveCoachingPanel({
  score,
  metrics,
  tip,
  className,
}: LiveCoachingPanelProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 34;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">Coaching in tempo reale</p>
      </div>
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 76 76" aria-hidden>
            <circle cx="38" cy="38" r="34" fill="none" stroke="#E2E8F0" strokeWidth="6" />
            <circle
              cx="38"
              cy="38"
              r="34"
              fill="none"
              stroke="#1E324E"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold tabular-nums leading-none text-slate-900">
              {clamped}
            </span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm text-slate-600">{m.label}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
                  {Math.round(m.value)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", barColor(m.tone))}
                  style={{ width: `${Math.max(0, Math.min(100, m.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {tip ? (
        <div className="border-t border-slate-100 bg-[#1E324E]/[0.04] px-4 py-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#1E324E]/70">
            Suggerimento
          </p>
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#345884]" />
            <p className="text-sm leading-relaxed text-slate-700">{tip}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
