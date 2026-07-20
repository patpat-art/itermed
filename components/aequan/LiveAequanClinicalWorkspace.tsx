"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClinicalActionBar, type ClinicalAction } from "@/components/aequan/ClinicalActionBar";
import { Badge } from "@/app/ui/badge";

export type LiveAequanCaseMeta = {
  title: string;
  specialty?: string | null;
  patientAge?: number | string | null;
  patientSex?: string | null;
  caseId: string;
};

type LiveAequanClinicalWorkspaceProps = {
  caseMeta: LiveAequanCaseMeta;
  backHref?: string;
  children: ReactNode;
  onClinicalAction?: (action: ClinicalAction) => void;
};

/**
 * Production AEQUAN clinical workspace — case strip + dual-pane host.
 * Navigation lives in DashboardSidebar only (no duplicate top navbar).
 */
export function LiveAequanClinicalWorkspace({
  caseMeta,
  backHref = "/dashboard/prassi",
  children,
  onClinicalAction,
}: LiveAequanClinicalWorkspaceProps) {
  const ageLabel =
    caseMeta.patientAge != null && String(caseMeta.patientAge).trim()
      ? `${caseMeta.patientAge} anni`
      : "età N/D";
  const sexLabel =
    caseMeta.patientSex === "F" || caseMeta.patientSex === "M"
      ? caseMeta.patientSex
      : "sesso N/D";

  const handleAction = (action: ClinicalAction) => {
    onClinicalAction?.(action);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aequan-clinical-action", { detail: { action } }),
      );
    }
    if (typeof document === "undefined") return;
    const targetId =
      action === "prescribe"
        ? "aequan-sim-exams"
        : action === "diagnose"
          ? "aequan-sim-conclusion"
          : "aequan-sim-chat";
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-ui-bg text-text-primary">
      <div className="w-full border-b border-border bg-panel-bg px-1 py-3 sm:px-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Link
                href={backHref}
                className="aequan-interactive inline-flex items-center gap-1.5 rounded-xl border border-border bg-ui-bg px-2.5 py-1.5 text-[11px] font-medium text-text-secondary hover:text-brand-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Libreria casi
              </Link>
              <Badge className="rounded-xl border-brand-primary/30 bg-brand-primary/10 text-[10px] text-brand-primary">
                Sessione clinica live
              </Badge>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-secondary">
              Workspace clinico
            </p>
            <h1 className="font-display truncate text-base font-semibold text-text-primary">
              {caseMeta.title}
            </h1>
            <p className="mt-0.5 text-xs text-text-secondary">
              {caseMeta.specialty?.trim() || "Specialità non specificata"} · Paziente {ageLabel} (
              {sexLabel}) · {caseMeta.caseId.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 py-3">
        <ClinicalActionBar onAction={handleAction} />
        <div className="min-h-0 w-full flex-1 rounded-xl border border-border bg-panel-bg p-2 shadow-aequan-panel sm:p-3">
          {children}
        </div>
      </div>
    </div>
  );
}
