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
 * Compact clinical host — fills remaining Prassi grid columns without expanding width.
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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden overflow-hidden bg-transparent text-text-primary">
      <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2 overflow-x-hidden">
        <Link
          href={backHref}
          className="aequan-interactive inline-flex items-center gap-1.5 rounded-xl border border-border bg-ui-bg px-2.5 py-1.5 text-[11px] font-medium text-text-secondary hover:text-brand-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          Libreria casi
        </Link>
        <Badge className="rounded-xl border-brand-primary/30 bg-brand-primary/10 text-[10px] text-brand-primary">
          Live
        </Badge>
        <span className="min-w-0 truncate text-[11px] text-slate-500" title={caseMeta.title}>
          {caseMeta.specialty?.trim() || "Specialità N/D"} ·{" "}
          {caseMeta.caseId.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="shrink-0 overflow-x-hidden">
        <ClinicalActionBar onAction={handleAction} />
      </div>

      <div className="mt-2 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
