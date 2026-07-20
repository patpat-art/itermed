import { AnalyticsHub } from "@/components/analytics/AnalyticsHub";
import { fetchAnalyticsPageData } from "@/lib/analytics/analytics-queries";
import { requireUser } from "@/lib/require-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage() {
  const user = await requireUser();
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

      <AnalyticsHub initialData={data} />
    </div>
  );
}
