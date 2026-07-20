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
    <div className="mx-auto w-full max-w-7xl space-y-6 overflow-y-auto overflow-x-hidden p-6">
      <div className="mb-6">
        <OverviewHero
          userName={user.name}
          completedCount={overview.completedCount}
          casesThisWeek={overview.casesThisWeek}
          focusLabel={overview.focusLabel}
          iterMedScore={overview.iterMedScore}
          focusShort={overview.focusShort}
          streakDays={overview.streakDays}
        />
      </div>

      <section className="grid grid-cols-12 items-start gap-6">
        {/* Left — radar + recent cases stacked */}
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-7">
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-950 dark:text-slate-100">
                Profilo competenze
              </CardTitle>
              <CardDescription>
                Media reale sulle 5 dimensioni IterMed dai report completati (0–100).
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden pb-5 pt-1">
              {overview.completedCount > 0 ? (
                <div className="relative flex h-[280px] w-full items-center justify-center overflow-hidden">
                  <CompetencyRadarChart data={overview.radarData} />
                </div>
              ) : (
                <div className="flex h-[280px] w-full items-center justify-center px-4">
                  <p className="text-center text-sm text-zinc-500">
                    Nessun report completato. Avvia una simulazione per generare il tuo profilo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-medium text-zinc-950 dark:text-slate-100">
                  Ultimi casi affrontati
                </CardTitle>
                <CardDescription>
                  Storico reale degli ultimi report completati dal database.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="max-h-72 overflow-y-auto overflow-x-hidden">
              <RecentSessionsTimeline sessions={overview.recentSessions} />
            </CardContent>
          </Card>
        </div>

        {/* Right — simulator / focus / week */}
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-5">
          <OverviewQuickActions
            focusShort={overview.focusShort}
            casesThisWeek={overview.casesThisWeek}
          />
        </div>
      </section>
    </div>
  );
}
