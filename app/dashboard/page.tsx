import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/ui/card";
import { CompetencyRadarChart } from "@/components/overview/CompetencyRadarChart";
import { OverviewHero } from "@/components/overview/OverviewHero";
import { OverviewQuickActions } from "@/components/overview/OverviewQuickActions";
import { RecentSessionsTimeline } from "@/components/overview/RecentSessionsTimeline";
import { fetchUserOverviewData } from "@/lib/overview-queries";
import { requireUser } from "@/lib/require-user";

type DashboardPageProps = {
  searchParams?: Promise<{ specialty?: string }> | { specialty?: string };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearch =
    searchParams && "then" in searchParams ? await searchParams : searchParams;
  if (resolvedSearch?.specialty?.trim()) {
    redirect(
      `/dashboard/prassi?specialty=${encodeURIComponent(resolvedSearch.specialty.trim())}`,
    );
  }

  const user = await requireUser();
  const overview = await fetchUserOverviewData(user.id);

  return (
    <div className="flex h-full flex-col gap-1">
      <OverviewHero
        userName={user.name}
        completedCount={overview.completedCount}
        casesThisWeek={overview.casesThisWeek}
        focusLabel={overview.focusLabel}
        iterMedScore={overview.iterMedScore}
        focusShort={overview.focusShort}
        streakDays={overview.streakDays}
      />

      <section className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-3">
        <Card className="bg-white/80 border-zinc-200/80 h-80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">Profilo competenze</CardTitle>
            <CardDescription>
              Media reale sulle 5 dimensioni IterMed dai report completati (0–100).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-1 pb-4 h-48 md:h-56 flex items-center justify-center">
            {overview.completedCount > 0 ? (
              <CompetencyRadarChart data={overview.radarData} />
            ) : (
              <p className="text-sm text-zinc-500 text-center px-4">
                Nessun report completato. Avvia una simulazione per generare il tuo profilo.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <OverviewQuickActions
            focusShort={overview.focusShort}
            casesThisWeek={overview.casesThisWeek}
          />
        </div>
      </section>

      <section className="-mt-6 shrink-0">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-medium text-zinc-950">
                Ultimi casi affrontati
              </CardTitle>
              <CardDescription>
                Storico reale degli ultimi report completati dal database.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="max-h-64 md:max-h-72 overflow-y-auto">
            <RecentSessionsTimeline sessions={overview.recentSessions} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
