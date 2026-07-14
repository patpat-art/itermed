import { Sparkles } from "lucide-react";
import { Badge } from "@/app/ui/badge";
import type { ClinicalCoachInsight } from "@/lib/statistics-queries";

type AiClinicalCoachProps = {
  insights: ClinicalCoachInsight[];
};

export function AiClinicalCoach({ insights }: AiClinicalCoachProps) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-6">
        L&apos;AI Clinical Coach analizzerà i tuoi report dopo la prima simulazione completata.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        <Sparkles className="h-4 w-4 text-violet-600" />
        AI Clinical Coach
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">
        Suggerimenti personalizzati in base alle aree con punteggio medio più basso nei tuoi
        SessionReport completati.
      </p>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <article
            key={insight.priorityArea}
            className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Priorità {index + 1}
                </p>
                <h3 className="text-sm font-semibold text-zinc-950 mt-0.5">{insight.priorityArea}</h3>
              </div>
              <span className="rounded-xl bg-white border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-800">
                {insight.score}/100
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-700 leading-relaxed">{insight.recommendation}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {insight.focusTags.map((tag) => (
                <Badge key={tag} variant="default" className="bg-white/90">
                  {tag}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
