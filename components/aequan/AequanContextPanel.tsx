"use client";

import { useState } from "react";
import {
  Activity,
  BookOpen,
  Euro,
  FileText,
  HeartPulse,
} from "lucide-react";
import type {
  MockGuideline,
  MockPrescription,
  MockVitalSign,
} from "@/lib/mock-data/aequan-mock-data";
import { cn } from "@/app/utils/cn";

type ContextTab = "guidelines" | "prescriptions" | "vitals";

type AequanContextPanelProps = {
  guidelines: MockGuideline[];
  prescriptions: MockPrescription[];
  vitals: MockVitalSign[];
  totalCostEur: number;
  elapsedMinutes: number;
  activeTab?: ContextTab;
  onTabChange?: (tab: ContextTab) => void;
  defaultTab?: ContextTab;
  className?: string;
};

const TAB_CONFIG: Array<{ id: ContextTab; label: string; icon: typeof BookOpen }> = [
  { id: "guidelines", label: "Linee Guida (PDF)", icon: BookOpen },
  { id: "prescriptions", label: "Prescrizioni & Costi SSN", icon: Euro },
  { id: "vitals", label: "Parametri Vitali", icon: HeartPulse },
];

function vitalStatusColor(status: MockVitalSign["status"]) {
  switch (status) {
    case "risk":
      return "text-status-risk border-status-risk/30 bg-status-risk/5";
    case "warn":
      return "text-status-warn border-status-warn/30 bg-status-warn/5";
    default:
      return "text-status-safe border-status-safe/30 bg-status-safe/5";
  }
}

/** Right-pane tabbed context — guidelines, prescriptions, vitals. */
export function AequanContextPanel({
  guidelines,
  prescriptions,
  vitals,
  totalCostEur,
  elapsedMinutes,
  activeTab: controlledTab,
  onTabChange,
  defaultTab = "vitals",
  className,
}: AequanContextPanelProps) {
  const [internalTab, setInternalTab] = useState<ContextTab>(defaultTab);
  const activeTab = controlledTab ?? internalTab;

  const setActiveTab = (tab: ContextTab) => {
    onTabChange?.(tab);
    if (controlledTab === undefined) setInternalTab(tab);
  };

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-h-0 rounded-aequan-lg border border-border bg-panel-bg shadow-aequan-panel overflow-hidden",
        className,
      )}
    >
      {/* Tab bar */}
      <div className="shrink-0 flex border-b border-border bg-ui-bg/50 overflow-x-auto scrollbar-none">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "aequan-interactive flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px",
              activeTab === id
                ? "border-brand-primary text-brand-primary bg-panel-bg"
                : "border-transparent text-text-secondary hover:text-text-primary hover:bg-panel-bg/80",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-aequan p-4">
        {activeTab === "guidelines" && (
          <div className="space-y-2">
            <p className="text-xs text-text-secondary mb-3">
              Documenti RAG caricati localmente — citazioni verificabili nel report finale.
            </p>
            {guidelines.map((doc) => (
              <article
                key={doc.id}
                className="aequan-interactive rounded-aequan border border-border bg-ui-bg/50 p-3 hover:border-brand-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-text-primary leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {doc.source} · {doc.pages} pag. · Caricato {doc.uploadedAt}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-aequan border border-border bg-ui-bg px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-primary" />
                <span className="text-xs text-text-secondary">Tempo clinico simulato</span>
              </div>
              <span className="text-sm font-mono font-tabular font-medium text-text-primary">
                {elapsedMinutes} min
              </span>
            </div>

            <div className="flex items-center justify-between rounded-aequan border border-brand-primary/20 bg-brand-primary/5 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-brand-primary" />
                <span className="text-xs font-medium text-text-primary">Costo totale SSN</span>
              </div>
              <span className="text-lg font-mono font-tabular font-semibold text-brand-primary">
                €{totalCostEur}
              </span>
            </div>

            <ul className="space-y-2">
              {prescriptions.map((rx) => (
                <li
                  key={rx.id}
                  className="aequan-interactive flex items-center justify-between gap-3 rounded-aequan border border-border bg-panel-bg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{rx.name}</p>
                    <p className="text-[10px] text-text-secondary">{rx.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-tabular text-text-primary">
                      €{rx.costEur}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-medium uppercase",
                        rx.status === "completed" ? "text-status-safe" : "text-status-warn",
                      )}
                    >
                      {rx.status === "completed" ? "Completato" : "In attesa"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "vitals" && (
          <div className="grid grid-cols-2 gap-2">
            {vitals.map((v) => (
              <div
                key={v.label}
                className={cn(
                  "aequan-interactive rounded-aequan border px-3 py-2.5",
                  vitalStatusColor(v.status),
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  {v.label}
                </p>
                <p className="text-lg font-mono font-tabular font-semibold mt-0.5">
                  {v.value}
                  <span className="text-xs font-normal ml-1 opacity-70">{v.unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
