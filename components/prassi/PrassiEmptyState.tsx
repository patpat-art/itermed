import type { ElementType } from "react";
import {
  ClipboardCheck,
  Euro,
  HeartHandshake,
  Pill,
  Scale,
  Stethoscope,
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

function InfoTile({
  icon: Icon,
  children,
}: {
  icon: ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 px-4 py-4 text-center">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#345884] shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: ElementType;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums text-slate-900">{value}</p>
        <p className="truncate text-[11px] text-slate-400">{caption}</p>
      </div>
    </div>
  );
}

export function PrassiWelcomeDashboard({ stats }: PrassiWelcomeDashboardProps) {
  const casesThisWeek = stats?.casesThisWeek ?? 0;
  const averageScore =
    stats?.averageScore != null ? Math.round(stats.averageScore) : null;
  const focusShort = stats?.focusShort?.trim() || "Appropriatezza prescrittiva";

  return (
    <div className="flex h-full min-h-0 flex-col justify-center gap-8 py-4">
      <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E324E]/8">
          <Stethoscope className="h-7 w-7 text-[#1E324E]" strokeWidth={1.75} />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold tracking-tight text-slate-900">
            Seleziona un caso clinico a sinistra
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-500">
            La Prassi Clinica è il tuo ambiente di esercitazione medico-legale: dialoga con il
            paziente, richiedi esami e chiudi il caso rispettando linee guida e sostenibilità SSN.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <InfoTile icon={Euro}>
            Ogni prescrizione consuma budget SSN e tempo clinico simulato.
          </InfoTile>
          <InfoTile icon={HeartHandshake}>
            L&apos;empatia con il paziente influenza il punteggio finale.
          </InfoTile>
          <InfoTile icon={Scale}>
            Documentazione e linee guida proteggono la tutela medico-legale.
          </InfoTile>
        </div>

        <p className="mx-auto max-w-lg text-xs italic leading-relaxed text-slate-400">
          &ldquo;La tutela legale del medico si fonda sull&apos;aderenza rigorosa alle buone
          pratiche clinico-assistenziali e alle linee guida ufficiali&rdquo; — Art. 5, Legge
          24/2017 (Gelli-Bianco)
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-3">
        <StatTile
          icon={ClipboardCheck}
          label="Questa settimana"
          value={String(casesThisWeek)}
          caption={casesThisWeek === 1 ? "caso completato" : "casi completati"}
        />
        <StatTile
          icon={Target}
          label="Punteggio medio"
          value={averageScore != null ? `${averageScore}/100` : "—"}
          caption="Media sessioni completate"
        />
        <StatTile
          icon={Pill}
          label="Focus consigliato"
          value={focusShort}
          caption="Dimensione da rafforzare"
        />
      </div>
    </div>
  );
}

/** @deprecated Prefer PrassiWelcomeDashboard — kept as alias for older imports. */
export function PrassiEmptyState(props: PrassiWelcomeDashboardProps) {
  return <PrassiWelcomeDashboard {...props} />;
}
