"use client";

import { useState } from "react";
import Link from "next/link";
import { AequanChatPane } from "@/components/aequan/AequanChatPane";
import { AequanContextPanel } from "@/components/aequan/AequanContextPanel";
import { ClinicalActionBar, type ClinicalAction } from "@/components/aequan/ClinicalActionBar";
import { MOCK_SIMULATION } from "@/lib/mock-data/aequan-mock-data";
import { Badge } from "@/app/ui/badge";

/**
 * AEQUAN Clinical Workspace — dual-pane Med-Tech Class layout (demo / design reference).
 * No top nav links — navigation belongs in DashboardSidebar for app routes.
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
    <div className="flex min-h-screen w-full flex-col bg-ui-bg text-text-primary">
      <div className="border-b border-border bg-panel-bg px-4 py-3 md:px-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Link
                href="/demo/report"
                className="aequan-interactive rounded-xl bg-brand-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-brand-primary-hover"
              >
                Vedi Report Mock
              </Link>
              <Badge className="rounded-xl border-brand-primary/30 bg-brand-primary/10 text-[10px] text-brand-primary">
                Demo UI
              </Badge>
            </div>
            <h1 className="font-display text-base font-semibold text-text-primary">{sim.caseTitle}</h1>
            <p className="mt-0.5 text-xs text-text-secondary">
              {sim.specialty} · Paziente {sim.patient.age} anni ({sim.patient.sex}) · {sim.patient.id}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 p-3 md:p-4">
        <ClinicalActionBar onAction={handleClinicalAction} />
        <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-3 lg:grid-cols-2 md:gap-4">
          <AequanChatPane messages={sim.chatHistory} className="min-h-[420px] flex-1" />
          <AequanContextPanel
            guidelines={sim.guidelines}
            prescriptions={sim.prescriptions}
            vitals={sim.vitals}
            totalCostEur={totalCost}
            elapsedMinutes={sim.elapsedMinutes}
            activeTab={contextTab}
            onTabChange={setContextTab}
            className="min-h-[420px] flex-1"
          />
        </div>
      </div>
    </div>
  );
}
