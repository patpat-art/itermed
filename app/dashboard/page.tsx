import { redirect } from "next/navigation";
import { BarChart3, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";
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
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">
      <OverviewHero
        userName={user.name}
        completedCount={overview.completedCount}
        casesThisWeek={overview.casesThisWeek}
        focusLabel={overview.focusLabel}
        iterMedScore={overview.iterMedScore}
        focusShort={overview.focusShort}
        streakDays={overview.streakDays}
      />

      <section className="grid grid-cols-12 items-start gap-6">
        <div className="col-span-12 flex flex-col gap-6 lg:col-span-7">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Profilo competenze</CardTitle>
                  <p className="mt-0.5 text-sm text-slate-500">Media sulle 5 dimensioni (0–100)</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-6 pt-4">
              {overview.completedCount > 0 ? (
                <div className="relative flex h-[300px] w-full items-center justify-center">
                  <CompetencyRadarChart data={overview.radarData} />
                </div>
              ) : (
                <div className="flex h-[220px] w-full flex-col items-center justify-center gap-2 px-4 text-center">
                  <p className="text-sm text-slate-500">
                    Completa il primo caso per vedere il profilo competenze.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Ultimi casi</CardTitle>
                  <p className="mt-0.5 text-sm text-slate-500">Sessioni completate di recente</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto pt-4">
              <RecentSessionsTimeline sessions={overview.recentSessions} />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <OverviewQuickActions
            focusShort={overview.focusShort}
            casesThisWeek={overview.casesThisWeek}
          />
        </div>
      </section>
    </div>
  );
}
