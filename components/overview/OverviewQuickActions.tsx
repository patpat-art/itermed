import Link from "next/link";
import { Play, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";

type OverviewQuickActionsProps = {
  focusShort: string;
  casesThisWeek: number;
};

export function OverviewQuickActions({ focusShort, casesThisWeek }: OverviewQuickActionsProps) {
  return (
    <Card className="bg-white/80 border-zinc-200/80 h-80">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-950">Simulatore</CardTitle>
        <CardDescription>Avvia una simulazione in un click, o continua il percorso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/dashboard/simulator" className="block">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-950 text-zinc-50 px-5 py-4 shadow-sm hover:bg-zinc-900 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-tight">Scegli caso clinico</p>
                <p className="text-xs text-zinc-300">
                  Scegli un caso disponibile e avvia la simulazione.
                </p>
              </div>
              <Play className="h-5 w-5" />
            </div>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Target className="h-4 w-4 text-zinc-600" />
              <span>Focus</span>
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-950">{focusShort}</p>
            <p className="text-xs text-zinc-500">Dimensione con media più bassa</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Calendar className="h-4 w-4 text-zinc-600" />
              <span>Settimana</span>
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-950">
              {casesThisWeek} {casesThisWeek === 1 ? "caso" : "casi"}
            </p>
            <p className="text-xs text-zinc-500">Attività negli ultimi 7 giorni</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
