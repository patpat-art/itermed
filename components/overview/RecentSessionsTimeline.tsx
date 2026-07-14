import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/app/ui/badge";
import { DifficultyBadge } from "@/components/dashboard/DifficultyBadge";
import type { RecentSessionRow } from "@/lib/overview-queries";

type RecentSessionsTimelineProps = {
  sessions: RecentSessionRow[];
};

export function RecentSessionsTimeline({ sessions }: RecentSessionsTimelineProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-6 text-center">
        Nessun caso completato ancora. Avvia una simulazione per iniziare il tuo storico.
      </p>
    );
  }

  return (
    <div className="divide-y divide-zinc-200/80 text-sm">
      {sessions.map((item) => (
        <Link
          key={item.sessionId}
          href={`/case/${item.caseId}/results?sessionId=${item.sessionId}`}
          className="group flex items-center justify-between gap-4 py-3.5 px-2 -mx-2 rounded-2xl hover:bg-zinc-50 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-zinc-950 group-hover:text-blue-700 transition-colors">
              {item.title}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="default">{item.specialty}</Badge>
              <DifficultyBadge difficulty={item.difficulty} />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">{item.completedLabel}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-zinc-50 text-sm font-semibold shadow-sm">
              {item.score}
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
