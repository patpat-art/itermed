import {
  ClipboardCheck,
  Euro,
  HeartHandshake,
  Pill,
  Scale,
  Shield,
  Target,
} from "lucide-react";

export type PrassiWelcomeStats = {
  casesThisWeek: number;
  averageScore: number | null;
  focusShort: string;
};

type PrassiWelcomeDashboardProps = {
  stats?: PrassiWelcomeStats;
};

export function PrassiWelcomeDashboard({ stats }: PrassiWelcomeDashboardProps) {
  const casesThisWeek = stats?.casesThisWeek ?? 0;
  const averageScore =
    stats?.averageScore != null ? Math.round(stats.averageScore) : null;
  const focusShort = stats?.focusShort?.trim() || "Appropriatezza prescrittiva";

  return (
    <div className="flex h-full min-h-[480px] flex-col justify-between bg-slate-50/40 p-8">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#345884]/15 bg-[#345884]/10">
              <Shield className="h-6 w-6 text-[#345884]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-[#2F4156]">
                Seleziona un caso clinico a sinistra per iniziare la simulazione
              </h2>
              <p className="text-sm leading-relaxed text-slate-500">
                La Prassi Clinica è il tuo ambiente di esercitazione medico-legale: dialoga con il
                paziente, richiedi esami e chiudi il caso rispettando linee guida e sostenibilità SSN.
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
            <li className="flex items-start gap-2.5 text-sm text-slate-600">
              <Euro className="mt-0.5 h-4 w-4 shrink-0 text-[#345884]" />
              <span>
                Ogni prescrizione consuma budget del SSN e richiede tempo clinico simulato.
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-slate-600">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-[#345884]" />
              <span>
                L&apos;empatia con il paziente influenza il punteggio finale della sessione.
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-slate-600">
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-[#345884]" />
              <span>
                La documentazione e l&apos;aderenza alle linee guida proteggono la tutela
                medico-legale (Gelli-Bianco).
              </span>
            </li>
          </ul>
        </div>

        <blockquote className="rounded-xl border border-slate-100 border-l-4 border-l-[#345884] bg-white px-5 py-4 shadow-sm">
          <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Promemoria istituzionale · Legge Gelli-Bianco
          </p>
          <p className="mt-2 text-sm italic leading-relaxed text-[#2F4156]">
            &ldquo;La tutela legale del medico si fonda sull&apos;aderenza rigorosa alle buone
            pratiche clinico-assistenziali e alle raccomandazioni previste dalle linee guida
            ufficiali (Art. 5, Legge 24/2017).&rdquo;
          </p>
        </blockquote>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <ClipboardCheck className="h-4 w-4 text-[#345884]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Questa settimana
            </span>
          </div>
          <p className="font-display text-2xl font-semibold tabular-nums text-[#2F4156]">
            {casesThisWeek}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {casesThisWeek === 1 ? "caso completato" : "casi completati"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Target className="h-4 w-4 text-[#345884]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Punteggio medio
            </span>
          </div>
          <p className="font-display text-2xl font-semibold tabular-nums text-[#2F4156]">
            {averageScore != null ? `${averageScore}` : "—"}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Media sulle sessioni completate</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Pill className="h-4 w-4 text-[#345884]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Focus consigliato
            </span>
          </div>
          <p className="font-display text-base font-semibold leading-snug text-[#2F4156]">
            {focusShort}
          </p>
          <p className="mt-1 text-xs text-slate-500">Dimensione da rafforzare</p>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Prefer PrassiWelcomeDashboard — kept as alias for older imports. */
export function PrassiEmptyState(props: PrassiWelcomeDashboardProps) {
  return <PrassiWelcomeDashboard {...props} />;
}
