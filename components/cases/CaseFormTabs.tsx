"use client";

import { useState, type ReactNode } from "react";
import { cn } from "../../app/utils/cn";

type TabId = "general" | "objective" | "advanced";

type CaseFormTabsProps = {
  general: ReactNode;
  objective: ReactNode;
  advanced: ReactNode;
};

export function CaseFormTabs({ general, objective, advanced }: CaseFormTabsProps) {
  const [tab, setTab] = useState<TabId>("general");

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "general", label: "Generali" },
    { id: "objective", label: "Esame obiettivo" },
    { id: "advanced", label: "Esami avanzati" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-[11px] font-medium transition-colors",
              tab === t.id
                ? "border-zinc-300 bg-white text-zinc-900 shadow-sm"
                : "border-transparent text-zinc-600 hover:border-zinc-200/70 hover:bg-white/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === "general" ? "block" : "hidden"}>{general}</div>
      <div className={tab === "objective" ? "block" : "hidden"}>{objective}</div>
      <div className={tab === "advanced" ? "block" : "hidden"}>{advanced}</div>
    </div>
  );
}

