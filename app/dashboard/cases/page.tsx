import { prisma } from "../../../lib/prisma";
import { visibleCasesWhere } from "../../../lib/access";
import { requireUser } from "../../../lib/require-user";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { StartCaseButtons } from "../../../components/cases/StartCaseButtons";

export default async function DashboardCasesPage() {
  const user = await requireUser();
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  let decks:
    | {
        id: string;
        title: string;
        isPublic: boolean;
        ownerId: string;
        _count: { cases: number };
      }[]
    | null = null;

  let cases:
    | {
        id: string;
        title: string;
        specialty: string | null;
        createdById: string;
        isGlobal: boolean;
        deck: { title: string } | null;
      }[]
    | null = null;

  if (hasDatabase) {
    try {
      const [deckRows, caseRows] = await Promise.all([
        prisma.caseDeck.findMany({
          where: {
            OR: [{ ownerId: user.id }, { isPublic: true }],
          },
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { cases: true } } },
        }),
        prisma.clinicalCase.findMany({
          where: visibleCasesWhere(user.id),
          orderBy: { updatedAt: "desc" },
          include: { deck: true },
          take: 30,
        }),
      ]);
      decks = deckRows;
      cases = caseRows;
    } catch {
      // fallback a dati statici demo se Prisma fallisce
      decks = null;
      cases = null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Casi</h1>
        <p className="text-sm text-zinc-400">
          Libreria e deck (stile Anki).
          {hasDatabase
            ? " Solo i casi a cui hai accesso (tuoi, tuoi deck o deck pubblici)."
            : " Il database non è configurato: vengono mostrati solo esempi statici."}
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">Deck</CardTitle>
            <CardDescription>Raccolte di casi condivisibili.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="divide-y divide-zinc-200/80">
              {(decks ??
                [
                  {
                    id: "deck_core",
                    title: "Core – Urgenze",
                    isPublic: true,
                    ownerId: "demo",
                    _count: { cases: 3 },
                  },
                ]
              ).map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-950">{d.title}</p>
                    <p className="text-xs text-zinc-500">{d._count.cases} casi</p>
                  </div>
                  <Badge variant={d.isPublic ? "success" : "default"}>
                    {d.isPublic ? "Pubblico" : "Privato"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">Casi disponibili</CardTitle>
            <CardDescription>
              Divisi in 2 gruppi: globali (per tutti) e individuali (solo tuoi).
            </CardDescription>
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
                    createdById: "seed",
                    isGlobal: true,
                    deck: { title: "Core – Urgenze" },
                  },
                  {
                    id: "cs_002",
                    title: "Febbre persistente in paziente anziano",
                    specialty: "Medicina interna",
                    createdById: user.id,
                    isGlobal: false,
                    deck: null,
                  },
                ];
              const globalCases = source.filter((c) => c.isGlobal);
              const personalCases = source.filter((c) => !c.isGlobal && c.createdById === user.id);
              const renderCase = (c: (typeof source)[number]) => (
                <div
                  key={c.id}
                  className="py-3 px-2 -mx-2 rounded-2xl hover:bg-zinc-100 transition-colors flex flex-col gap-1"
                >
                  <div>
                    <p className="font-medium text-zinc-950">{c.title}</p>
                    <p className="text-xs text-zinc-500">
                      {c.specialty ?? "Specialità N/D"}
                      {c.isGlobal
                        ? c.deck?.title
                          ? ` · Globale · ${c.deck.title}`
                          : " · Globale"
                        : " · Individuale"}
                    </p>
                  </div>
                  <StartCaseButtons caseId={c.id} />
                </div>
              );

              return (
                <div className="space-y-4">
                  <section>
                    <p className="text-xs font-medium text-zinc-600 mb-1.5">Globali (tutti)</p>
                    <div className="divide-y divide-zinc-200/80">
                      {globalCases.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-2">Nessun caso globale disponibile.</p>
                      ) : (
                        globalCases.map(renderCase)
                      )}
                    </div>
                  </section>
                  <section>
                    <p className="text-xs font-medium text-zinc-600 mb-1.5">I tuoi casi individuali</p>
                    <div className="divide-y divide-zinc-200/80">
                      {personalCases.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-2">Non hai ancora creato casi individuali.</p>
                      ) : (
                        personalCases.map(renderCase)
                      )}
                    </div>
                  </section>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

