import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";
import { AiClinicalCoach } from "@/components/statistics/AiClinicalCoach";
import { ScoreTrendChart } from "@/components/statistics/ScoreTrendChart";
import { fetchStatisticsPageData } from "@/lib/statistics-queries";
import { requireUser } from "@/lib/require-user";
import { OVERVIEW_RADAR_METRICS } from "@/lib/overview-queries";

export default async function StatisticsPage() {
  const user = await requireUser();
  const stats = await fetchStatisticsPageData(user.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Statistiche & AI Coach</h1>
        <p className="text-sm text-zinc-500">
          Trend di miglioramento e raccomandazioni clinico-legali basate sui tuoi report completati.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">
              Trend punteggi medi
            </CardTitle>
            <CardDescription>
              Andamento del punteggio totale nelle ultime {stats.completedCount || 0} sessioni
              completate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={stats.trend} />
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">Medie per dimensione</CardTitle>
            <CardDescription>Snapshot aggregato su tutti i report completati.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.completedCount === 0 ? (
              <p className="text-sm text-zinc-500">Nessun dato disponibile.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {OVERVIEW_RADAR_METRICS.map(({ metric, key }) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-zinc-200/80 bg-zinc-50 px-3 py-2.5"
                  >
                    <p className="text-zinc-500">{metric}</p>
                    <p className="text-lg font-semibold text-zinc-950 mt-0.5">
                      {stats.overallAverages[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">AI Clinical Coach</CardTitle>
          <CardDescription>
            Aree su cui concentrarti per migliorare la tua impronta professionale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiClinicalCoach insights={stats.coachInsights} />
        </CardContent>
      </Card>
    </div>
  );
}
