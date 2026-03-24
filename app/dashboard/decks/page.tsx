import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings, Trash2, Plus } from "lucide-react";
import { prisma } from "../../../lib/prisma";
import { userCanManageCase, userOwnsDeck, visibleCasesWhere } from "../../../lib/access";
import { requireUser } from "../../../lib/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

async function deleteDeck(formData: FormData) {
  "use server";

  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("ID deck mancante.");
  }

  const owned = await userOwnsDeck(user.id, id);
  if (!owned) {
    redirect("/dashboard/decks");
  }

  await prisma.clinicalCase.updateMany({
    where: { deckId: id },
    data: { deckId: null },
  });

  await prisma.caseDeck.delete({
    where: { id },
  });

  redirect("/dashboard/decks");
}

async function deleteCase(formData: FormData) {
  "use server";

  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("ID caso mancante.");
  }

  const can = await userCanManageCase(user.id, id);
  if (!can) {
    redirect("/dashboard/decks");
  }

  await prisma.caseNode.deleteMany({ where: { caseId: id } });
  await prisma.sessionReport.deleteMany({ where: { caseId: id } });
  await prisma.caseSession.deleteMany({ where: { caseId: id } });
  await prisma.clinicalCase.delete({ where: { id } });

  redirect("/dashboard/decks");
}

export default async function DashboardDecksPage() {
  const user = await requireUser();
  const hasDatabase = Boolean(process.env.DATABASE_URL);

  let decks:
    | {
        id: string;
        title: string;
        description: string | null;
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
        deck: { title: string; ownerId: string } | null;
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
          take: 50,
        }),
      ]);
      decks = deckRows;
      cases = caseRows;
    } catch {
      decks = null;
      cases = null;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Casi & Deck</h1>
        <p className="text-sm text-zinc-400">
          Gestisci rapidamente libreria casi e deck. Le funzioni di editing avanzato arriveranno
          negli step successivi.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-medium text-zinc-950">
                Casi clinici
              </CardTitle>
              <CardDescription>
                Elenco dei casi disponibili con azioni rapide.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/cases/new"
              className="inline-flex [&:hover_svg]:text-emerald-600"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={!hasDatabase}
                title="Aggiungi nuovo caso"
              >
                <Plus className="h-4 w-4 transition-colors" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="text-sm max-h-72 overflow-y-auto">
            <div className="divide-y divide-zinc-200/80">
              {(cases ??
                [
                  {
                    id: "cs_001",
                    title: "Dolore toracico in PS",
                    specialty: "Emergenza",
                    createdById: "",
                    deck: { title: "Core – Urgenze", ownerId: "" },
                  },
                ]
              ).map((c) => (
                <div
                  key={c.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-950">{c.title}</p>
                    <p className="text-xs text-zinc-500">
                      {c.specialty ?? "Specialità N/D"}
                      {c.deck?.title ? ` · Deck: ${c.deck.title}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/cases/${c.id}`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        disabled={!hasDatabase}
                        title="Modifica caso"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                    <form action={deleteCase} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        disabled={
                          !hasDatabase ||
                          !(c.createdById === user.id || c.deck?.ownerId === user.id)
                        }
                        title="Elimina caso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-zinc-200/80">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-medium text-zinc-950">Deck</CardTitle>
              <CardDescription>
                Raccolte di casi condivisibili, con azioni rapide.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/decks/new"
              className="inline-flex [&:hover_svg]:text-emerald-600"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                disabled={!hasDatabase}
                title="Crea nuovo deck"
              >
                <Plus className="h-4 w-4 transition-colors" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="text-sm max-h-72 overflow-y-auto">
            <div className="divide-y divide-zinc-200/80">
              {(decks ??
                [
                  {
                    id: "deck_core",
                    title: "Core – Urgenze",
                    description: "Deck demo con casi di PS per training iniziale.",
                    isPublic: true,
                    ownerId: "",
                    _count: { cases: 3 },
                  },
                ]
              ).map((deck) => (
                <div
                  key={deck.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-950">{deck.title}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {deck.description ?? "Nessuna descrizione"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {deck._count.cases} casi nel deck
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/decks/${deck.id}`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        disabled={!hasDatabase || deck.ownerId !== user.id}
                        title="Modifica deck"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                    <form action={deleteDeck} className="inline">
                      <input type="hidden" name="id" value={deck.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        disabled={!hasDatabase || deck.ownerId !== user.id}
                        title="Elimina deck"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

