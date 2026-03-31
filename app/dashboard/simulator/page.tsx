import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { visibleCasesWhere } from "../../../lib/access";
import { requireUser } from "../../../lib/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";

export default async function DashboardSimulatorPage() {
  const user = await requireUser();
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  let cases:
    | {
        id: string;
        title: string;
        specialty: string | null;
        difficulty: string;
        createdById: string;
        isGlobal: boolean;
        deck: { title: string } | null;
      }[]
    | null = null;

  if (hasDatabase) {
    try {
      const rows = await prisma.clinicalCase.findMany({
        where: visibleCasesWhere(user.id),
        orderBy: { updatedAt: "desc" },
        include: { deck: true },
        take: 12,
      });
      cases = rows;
    } catch {
      // se Prisma fallisce (db non pronto), restiamo sui casi demo
      cases = null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Simulatore</h1>
        <p className="text-sm text-zinc-400">
          Avvia rapidamente una simulazione scegliendo un caso
          {hasDatabase ? " dal database." : " (modalità demo senza database configurato)."}
        </p>
      </header>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Avvio rapido</CardTitle>
          <CardDescription>
            Apri la libreria casi per iniziare rapidamente una simulazione.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-950">Seleziona un caso dalla libreria</p>
            <p className="text-xs text-zinc-500">
              Scegli un caso reale disponibile per il tuo utente.
            </p>
          </div>
          <Link
            href="/dashboard/cases"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 text-zinc-50 px-4 py-2 text-sm font-medium hover:bg-zinc-900 transition-colors"
          >
            Vai ai casi
          </Link>
        </CardContent>
      </Card>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Scegli un caso</CardTitle>
          <CardDescription>Globali per tutti + individuali personali.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {(() => {
            const source =
              cases ??
              [
                {
                  id: "cs_001",
                  title: "Dolore toracico in PS",
                  specialty: "Emergenza",
                  difficulty: "MEDIUM",
                  createdById: "seed",
                  isGlobal: true,
                  deck: { title: "Core – Urgenze" },
                },
                {
                  id: "cs_002",
                  title: "Febbre persistente in paziente anziano",
                  specialty: "Medicina interna",
                  difficulty: "EASY",
                  createdById: user.id,
                  isGlobal: false,
                  deck: null,
                },
              ];

            const globalCases = source.filter((c) => c.isGlobal);
            const personalCases = source.filter((c) => !c.isGlobal && c.createdById === user.id);
            const renderRow = (c: (typeof source)[number]) => (
              <Link
                key={c.id}
                href={`/case/${c.id}`}
                className="flex items-center justify-between gap-4 py-3 rounded-2xl px-2 -mx-2 hover:bg-zinc-100 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-950">{c.title}</p>
                  <p className="text-xs text-zinc-500">
                    {c.specialty ?? "Specialità N/D"}
                    {c.isGlobal
                      ? c.deck?.title
                        ? ` · Globale · ${c.deck.title}`
                        : " · Globale"
                      : " · Individuale"}
                  </p>
                </div>
                <Badge className="shrink-0">{String(c.difficulty)}</Badge>
              </Link>
            );

            return (
              <div className="space-y-4">
                <section>
                  <p className="text-xs font-medium text-zinc-600 mb-1.5">Globali (tutti)</p>
                  <div className="divide-y divide-zinc-200/80">
                    {globalCases.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-2">Nessun caso globale disponibile.</p>
                    ) : (
                      globalCases.map(renderRow)
                    )}
                  </div>
                </section>
                <section>
                  <p className="text-xs font-medium text-zinc-600 mb-1.5">I tuoi casi individuali</p>
                  <div className="divide-y divide-zinc-200/80">
                    {personalCases.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-2">Non hai casi individuali.</p>
                    ) : (
                      personalCases.map(renderRow)
                    )}
                  </div>
                </section>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

