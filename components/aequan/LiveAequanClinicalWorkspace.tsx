"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AequanNavbar } from "@/components/layout/AequanNavbar";
import { ClinicalActionBar, type ClinicalAction } from "@/components/aequan/ClinicalActionBar";
import { Badge } from "@/app/ui/badge";

const LIVE_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/prassi", label: "Prassi Clinica" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/guidelines", label: "Linee Guida" },
];

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
 * Production AEQUAN clinical workspace shell — navbar + case strip + dual-pane host.
 * Embeds the live SimulatorClient (or other interactive engine) as children.
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
    <div className="flex min-h-dvh flex-col bg-ui-bg text-text-primary">
      <AequanNavbar
        navLinks={LIVE_NAV}
        sticky
        trailing={
          <Link
            href={backHref}
            className="aequan-interactive inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel-bg px-3 py-2 text-xs font-medium text-text-primary hover:bg-ui-bg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Libreria casi
          </Link>
        }
      />

      <div className="border-b border-border bg-panel-bg px-4 py-3 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-secondary">
              Workspace clinico
            </p>
            <h1 className="font-display text-base font-semibold text-text-primary">{caseMeta.title}</h1>
            <p className="mt-0.5 text-xs text-text-secondary">
              {caseMeta.specialty?.trim() || "Specialità non specificata"} · Paziente {ageLabel} (
              {sexLabel}) · {caseMeta.caseId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="rounded-xl border-brand-primary/30 bg-brand-primary/10 text-[10px] text-brand-primary">
              Sessione clinica live
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 p-3 md:p-4">
        <ClinicalActionBar onAction={handleAction} />
        <div className="min-h-0 flex-1 rounded-xl border border-border bg-panel-bg/40 p-2 shadow-aequan-panel md:p-3">
          {children}
        </div>
      </div>
    </div>
  );
}
