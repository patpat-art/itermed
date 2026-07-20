"use client";

import type { ReactNode } from "react";

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
  onClinicalAction?: (action: "prescribe" | "diagnose" | "consult") => void;
};

/**
 * Thin host wrapper for the active simulation.
 * Session chrome (title, timer, budget, actions) lives in SimulatorClient.
 */
export function LiveAequanClinicalWorkspace({
  children,
}: LiveAequanClinicalWorkspaceProps) {
  return <div className="w-full min-w-0">{children}</div>;
}
