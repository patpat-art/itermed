import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { prisma } from "../../../../lib/prisma";
import { authOptions } from "../../../../lib/auth-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { ResultsRadarClient } from "./ResultsRadarClient";

type ResultsPageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ sessionId?: string }> | { sessionId?: string };
};

export default async function CaseResultsPage({ params, searchParams }: ResultsPageProps) {
  const resolvedParams = "then" in params ? await params : params;
  const resolvedSearch =
    searchParams && "then" in searchParams ? await searchParams : searchParams;

  const sessionId = resolvedSearch?.sessionId;
  const caseId = resolvedParams.id;

  if (!sessionId) {
    return notFound();
  }

  const authSession = await getServerSession(authOptions);
  if (!authSession?.user?.id) {
    return notFound();
  }

  const session = await prisma.sessionReport.findUnique({
    where: { id: sessionId },
  });

  if (
    !session ||
    session.caseId !== caseId ||
    session.userId !== authSession.user.id
  ) {
    return notFound();
  }

  const radarData = [
    { metric: "Accuratezza clinica", key: "clinicalAccuracy", score: session.clinicalAccuracy },
    { metric: "Tutela medico-legale", key: "legalComplianceGelliBianco", score: session.legalComplianceGelliBianco },
    { metric: "Appropriatezza esami", key: "prescribingAppropriateness", score: session.prescribingAppropriateness },
    { metric: "Sostenibilità economica", key: "economicSustainability", score: session.economicSustainability },
    { metric: "Empatia", key: "empathy", score: session.empathy },
  ];

  const strengths: string[] = (session.rawTrace as any)?.feedback?.strengths ?? [];
  const weaknesses: string[] = (session.rawTrace as any)?.feedback?.weaknesses ?? [];
  const correctSolution: string | undefined = (session.rawTrace as any)?.feedback?.correctSolution;
  const dismissed = Boolean((session.rawTrace as any)?.dismissed);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-stretch justify-center px-4 py-10">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <div className="flex justify-start">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
        {dismissed ? (
          <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-2 text-xs text-amber-950">
            Caso abbandonato (Dismiss case): i punteggi sono stati registrati a 0 su tutti gli assi.
          </p>
        ) : null}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Report simulazione
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Risultati caso clinico
            </h1>
            <p className="text-xs text-zinc-600">
              Valutazione multidimensionale IterMed: clinica, medico-legale, appropriatezza, economia, empatia.
            </p>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-zinc-500">Score complessivo</span>
              <span className="text-3xl font-semibold tracking-tight">
                {Math.round(session.totalScore)}
              </span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          <Card className="bg-white/80 border-zinc-200/80">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Profilo competenze nel caso
                </CardTitle>
                <CardDescription>
                  Distribuzione dei punteggi sui cinque assi core di IterMed.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <ResultsRadarClient data={radarData} />
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-zinc-200/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Sintesi medico-legale
              </CardTitle>
              <CardDescription>
                Commento strutturato sulla difendibilità del percorso rispetto a Gelli-Bianco e linee guida.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-zinc-700 whitespace-pre-line">
                {session.notes ?? "Nessuna nota medico-legale disponibile per questa sessione."}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/80 border-zinc-200/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Punti di forza
              </CardTitle>
              <CardDescription>
                Comportamenti da consolidare nella pratica clinica reale.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5">
              {strengths.length === 0 ? (
                <p className="text-zinc-500">
                  Nessun punto di forza specifico elencato.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {strengths.map((item, idx) => (
                    <li
                      key={idx}
                      className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-1.5"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 border-zinc-200/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Aree di miglioramento
              </CardTitle>
              <CardDescription>
                Aspetti critici su cui lavorare nelle prossime simulazioni.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-1.5">
              {weaknesses.length === 0 ? (
                <p className="text-zinc-500">
                  Nessuna criticità specifica elencata.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {weaknesses.map((item, idx) => (
                    <li
                      key={idx}
                      className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-1.5"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="bg-white/80 border-zinc-200/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Gestione esperta di riferimento
              </CardTitle>
              <CardDescription>
                Come un medico esperto, aderente a linee guida e Legge Gelli-Bianco, avrebbe potuto strutturare il caso.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-zinc-700 whitespace-pre-line">
              {correctSolution ?? "La soluzione di riferimento non è disponibile per questa sessione."}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

