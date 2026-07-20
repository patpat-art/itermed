"use client";

import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { ClinicalDeltaRow } from "@/lib/services/evaluation-report-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";
import { cn } from "@/app/utils/cn";
import { SafeLlmText } from "@/components/ui/safe-llm-content";

type GoldStandardCompareProps = {
  rows: ClinicalDeltaRow[];
};

function statusMeta(status: ClinicalDeltaRow["status"]) {
  switch (status) {
    case "MET":
      return {
        label: "Allineato",
        icon: CheckCircle2,
        chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
        rail: "border-l-emerald-500",
      };
    case "DELAYED":
      return {
        label: "Ritardato",
        icon: Clock3,
        chip: "border-amber-200 bg-amber-50 text-amber-900",
        rail: "border-l-amber-500",
      };
    default:
      return {
        label: "Mancato",
        icon: XCircle,
        chip: "border-rose-200 bg-rose-50 text-rose-800",
        rail: "border-l-rose-500",
      };
  }
}

/** Side-by-side Gold Standard vs user actions for debrief. */
export function GoldStandardCompare({ rows }: GoldStandardCompareProps) {
  if (rows.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-xl border-border bg-panel-bg shadow-aequan-panel">
      <CardHeader>
        <CardTitle className="font-display text-sm font-bold text-brand-primary">
          Confronto Gold Standard
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Protocollo di riferimento vs azioni eseguite durante la simulazione.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="hidden grid-cols-2 gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
          <span>Protocollo Gold Standard</span>
          <span>Azioni utente</span>
        </div>
        {rows.map((row, idx) => {
          const meta = statusMeta(row.status);
          const Icon = meta.icon;
          return (
            <div
              key={`${row.protocolAction}-${idx}`}
              className={cn(
                "grid grid-cols-1 gap-3 rounded-xl border border-border bg-ui-bg/60 p-3 md:grid-cols-2",
                "border-l-4",
                meta.rail,
              )}
            >
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                  Protocollo
                </p>
                <p className="text-sm font-medium text-text-primary">{row.protocolAction}</p>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      meta.chip,
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm text-slate-600",
                    row.status === "MISSED" && "text-rose-700/90 line-through decoration-rose-300",
                  )}
                >
                  {row.userAction?.trim() || "—"}
                </p>
                {row.penaltyOrBonusReason ? (
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    <SafeLlmText as="span">{row.penaltyOrBonusReason}</SafeLlmText>
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
