"use client";

import {
  Clock3,
  FlaskConical,
  History,
  LogIn,
  MessageSquare,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/utils/cn";

export type SessionTimelineEvent = {
  id: string;
  timeLabel: string;
  title: string;
  detail?: string;
  kind: "ingresso" | "dialogo" | "esame" | "vitale" | "nota";
  /** Future/awaiting step (grayed out, no time). */
  pending?: boolean;
  /** Highlight as the current step (mockup: light blue row). */
  current?: boolean;
};

type SessionEventTimelineProps = {
  events: SessionTimelineEvent[];
  className?: string;
};

const KIND_META: Record<
  SessionTimelineEvent["kind"],
  { icon: LucideIcon; label: string; tone: string }
> = {
  ingresso: { icon: LogIn, label: "Ingresso", tone: "bg-slate-100 text-slate-600" },
  dialogo: { icon: MessageSquare, label: "Dialogo", tone: "bg-blue-50 text-blue-600" },
  esame: { icon: FlaskConical, label: "Esame", tone: "bg-amber-50 text-amber-700" },
  vitale: { icon: Stethoscope, label: "Esame obiettivo", tone: "bg-emerald-50 text-emerald-600" },
  nota: { icon: Clock3, label: "Nota", tone: "bg-slate-100 text-slate-500" },
};

export function SessionEventTimeline({ events, className }: SessionEventTimelineProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
        <History className="h-4 w-4 text-slate-400" />
        <p className="text-sm font-semibold text-slate-800">Cronologia eventi</p>
      </div>
      <div className="scrollbar-aequan min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Gli eventi della sessione appariranno qui.
          </p>
        ) : (
          events.map((event, index) => {
            const meta = KIND_META[event.kind];
            const Icon = meta.icon;
            return (
              <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {index < events.length - 1 ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    event.pending ? "bg-slate-50 text-slate-300 ring-1 ring-slate-200" : meta.tone,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-lg px-2 py-1",
                    event.current && "bg-blue-50/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        event.pending ? "text-slate-400" : "text-slate-800",
                      )}
                    >
                      {event.title}
                    </p>
                    {event.timeLabel ? (
                      <span className="shrink-0 text-xs tabular-nums text-slate-400">
                        {event.timeLabel}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-medium uppercase tracking-wide",
                      event.pending ? "text-slate-300" : "text-slate-400",
                    )}
                  >
                    {meta.label}
                  </p>
                  {event.detail ? (
                    <p
                      className={cn(
                        "mt-1 line-clamp-2 text-sm leading-relaxed",
                        event.pending ? "text-slate-400" : "text-slate-500",
                      )}
                    >
                      {event.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
