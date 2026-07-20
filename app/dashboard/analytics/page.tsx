import { AnalyticsHub } from "@/components/analytics/AnalyticsHub";
import { fetchAnalyticsPageData } from "@/lib/analytics/analytics-queries";
import { requireUser } from "@/lib/require-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage() {
  const user = await requireUser();
  // fetchAnalyticsPageData never throws — empty leaderboard/stats when DB is empty or errors.
  const data = await fetchAnalyticsPageData(user.id);

  return (
    <div className="flex flex-col gap-5">
      <header className="border-b border-slate-200 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-800/70">
          Performance Hub · IterMed
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 mt-1">Analytics</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Profilo performance personale, registro comparativo nazionale e analisi longitudinale delle
          simulazioni cliniche completate.
        </p>
      </header>

      {data.leaderboard.top50.length === 0 && data.statistics.completedCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Nessuna simulazione completata ancora</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Il registro classifiche e i trend si popolano dopo la prima sessione con report
            completato. Nel frattempo puoi aggiornare nickname e preferenze di privacy nel pannello
            profilo qui sotto.
          </p>
        </div>
      ) : null}

      <AnalyticsHub initialData={data} />
    </div>
  );
}
