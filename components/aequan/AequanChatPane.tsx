"use client";

import type { MockChatMessage } from "@/lib/mock-data/aequan-mock-data";
import { cn } from "@/app/utils/cn";
import { AiTransparencyBadge } from "@/components/legal/AiTransparencyBadge";

type AequanChatPaneProps = {
  messages: MockChatMessage[];
  className?: string;
};

/** Left-pane medical chat — patient bubbles on ui-bg, doctor on brand-primary. */
export function AequanChatPane({ messages, className }: AequanChatPaneProps) {
  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-h-0 rounded-aequan-lg border border-border bg-panel-bg shadow-aequan-panel overflow-hidden",
        className,
      )}
    >
      <div className="shrink-0 space-y-2 border-b border-border px-4 py-3">
        <AiTransparencyBadge variant="workspace" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
          Simulazione Clinica
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          Interazione medico-paziente · Anamnesi in corso
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-aequan p-4 space-y-3">
        {messages.map((msg) => {
          const isDoctor = msg.role === "doctor";
          return (
            <div
              key={msg.id}
              className={cn("flex", isDoctor ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-aequan-lg px-3.5 py-2.5 text-sm leading-relaxed aequan-interactive",
                  isDoctor
                    ? "bg-brand-primary text-white rounded-br-sm"
                    : "bg-ui-bg text-text-secondary border border-border rounded-bl-sm",
                )}
              >
                <p>{msg.content}</p>
                <span
                  className={cn(
                    "mt-1 block text-[10px] font-mono font-tabular",
                    isDoctor ? "text-white/70" : "text-text-secondary/60",
                  )}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-border p-3 bg-panel-bg">
        <textarea
          rows={2}
          placeholder="Formula la prossima domanda al paziente..."
          className={cn(
            "w-full resize-none rounded-aequan border border-border bg-ui-bg px-3 py-2",
            "text-sm text-text-primary placeholder:text-text-secondary/50",
            "focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary",
            "aequan-interactive",
          )}
        />
      </div>
    </div>
  );
}
