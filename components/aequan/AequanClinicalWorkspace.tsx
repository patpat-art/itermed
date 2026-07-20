"use client";

import { useState } from "react";
import Link from "next/link";
import { AequanNavbar } from "@/components/layout/AequanNavbar";
import { AequanChatPane } from "@/components/aequan/AequanChatPane";
import { AequanContextPanel } from "@/components/aequan/AequanContextPanel";
import { ClinicalActionBar, type ClinicalAction } from "@/components/aequan/ClinicalActionBar";
import { MOCK_SIMULATION } from "@/lib/mock-data/aequan-mock-data";
import { Badge } from "@/app/ui/badge";

/**
 * AEQUAN Clinical Workspace — dual-pane Med-Tech Class layout (demo / design reference).
 * Production play uses LiveAequanClinicalWorkspace around SimulatorClient.
 */
export function AequanClinicalWorkspace() {
  const sim = MOCK_SIMULATION;
  const [contextTab, setContextTab] = useState<"guidelines" | "prescriptions" | "vitals">("vitals");

  const totalCost = sim.prescriptions.reduce((sum, rx) => sum + rx.costEur, 0);

  const handleClinicalAction = (action: ClinicalAction) => {
    if (action === "prescribe") setContextTab("prescriptions");
    if (action === "diagnose") setContextTab("vitals");
    if (action === "consult") setContextTab("guidelines");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-ui-bg text-text-primary">
      <AequanNavbar
        trailing={
          <Link
            href="/demo/report"
            className="aequan-interactive rounded-aequan bg-brand-primary px-4 py-2 text-xs font-medium text-white hover:bg-brand-primary-light"
          >
            Vedi Report Mock
          </Link>
        }
      />

      <div className="border-b border-border bg-panel-bg px-4 md:px-6 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-text-primary">{sim.caseTitle}</h1>
            <p className="mt-0.5 text-xs text-text-secondary">
              {sim.specialty} · Paziente {sim.patient.age} anni ({sim.patient.sex}) ·{" "}
              {sim.patient.id}
            </p>
          </div>
          <Badge className="rounded-aequan border-brand-primary/30 bg-brand-primary/10 text-[10px] text-brand-primary">
            Demo UI
          </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 md:p-4">
        <div className="mx-auto grid h-[calc(100dvh-8.5rem)] max-w-[1600px] grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-2">
            <AequanChatPane messages={sim.chatHistory} className="flex-1" />
            <ClinicalActionBar onAction={handleClinicalAction} />
          </div>
          <AequanContextPanel
            guidelines={sim.guidelines}
            prescriptions={sim.prescriptions}
            vitals={sim.vitals}
            totalCostEur={totalCost}
            elapsedMinutes={sim.elapsedMinutes}
            activeTab={contextTab}
            onTabChange={setContextTab}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
