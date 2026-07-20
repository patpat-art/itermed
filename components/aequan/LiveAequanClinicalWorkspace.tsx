"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClinicalActionBar, type ClinicalAction } from "@/components/aequan/ClinicalActionBar";
import { Badge } from "@/app/ui/badge";
import { AiTransparencyBadge } from "@/components/legal/AiTransparencyBadge";

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
 * Clinical host for active simulation — full-bleed session chrome (library hidden by PrassiShell).
 */
export function LiveAequanClinicalWorkspace({
  caseMeta,
  backHref = "/dashboard/prassi",
  children,
  onClinicalAction,
}: LiveAequanClinicalWorkspaceProps) {
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
    <div className="flex w-full min-w-0 flex-col bg-transparent text-text-primary">
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          Torna alla Libreria
        </Link>
        <Badge className="rounded-md border-emerald-200 bg-emerald-50 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
          Live
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {caseMeta.title}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {caseMeta.specialty?.trim() || "Specialità N/D"}
            {caseMeta.patientAge != null ? ` · ${caseMeta.patientAge} anni` : ""}
            {caseMeta.patientSex === "M"
              ? " · M"
              : caseMeta.patientSex === "F"
                ? " · F"
                : ""}
          </p>
        </div>
        <AiTransparencyBadge variant="workspace" />
      </div>

      <div className="shrink-0">
        <ClinicalActionBar onAction={handleAction} />
      </div>

      <div className="mt-3 min-w-0 w-full">{children}</div>
    </div>
  );
}
