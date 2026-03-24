import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { attachableCasesWhere } from "../../../../lib/access";
import { requireUser } from "../../../../lib/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Button } from "../../../ui/button";

async function createDeck(formData: FormData) {
  "use server";

  const user = await requireUser();
  const title = formData.get("title");
  const description = formData.get("description");
  const visibility = formData.get("visibility");
  const selectedCaseIds = formData.getAll("caseIds");

  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Il titolo del deck è obbligatorio.");
  }

  const isPublic = visibility === "public";

  const deck = await prisma.caseDeck.create({
    data: {
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      isPublic,
      ownerId: user.id,
    },
  });

  const caseIds = selectedCaseIds.filter((id): id is string => typeof id === "string" && !!id);
  if (caseIds.length > 0) {
    const allowed = await prisma.clinicalCase.findMany({
      where: { id: { in: caseIds }, ...attachableCasesWhere(user.id) },
      select: { id: true },
    });
    const allowedSet = new Set(allowed.map((r) => r.id));
    const safeIds = caseIds.filter((id) => allowedSet.has(id));
    if (safeIds.length > 0) {
      await prisma.clinicalCase.updateMany({
        where: { id: { in: safeIds } },
        data: { deckId: deck.id },
      });
    }
  }

  redirect("/dashboard/decks");
}

export default async function NewDeckPage() {
  const user = await requireUser();
  const cases = await prisma.clinicalCase.findMany({
    where: attachableCasesWhere(user.id),
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Nuovo deck</h1>
        <p className="text-sm text-zinc-400">
          Crea una nuova raccolta di casi. Potrai associare i casi al deck in un secondo momento.
        </p>
      </header>

      <Card className="bg-white/80 border-zinc-200/80 max-w-xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Dettagli deck</CardTitle>
          <CardDescription>
            Imposta le informazioni minime per identificare il deck nella libreria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createDeck} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700" htmlFor="title">
                Titolo
              </label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Es. Core – Urgenze PS"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700" htmlFor="description">
                Descrizione (opzionale)
              </label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Breve descrizione del focus del deck (es. training su dolore toracico, sepsi, triage avanzato)..."
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-700">Visibilità</span>
              <div className="flex items-center gap-3 text-xs">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    defaultChecked
                    className="h-3 w-3"
                  />
                  <span>Pubblico</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    className="h-3 w-3"
                  />
                  <span>Privato</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-700">Casi da includere nel deck</span>
              {cases.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Non ci sono ancora casi attivi nel database. Potrai collegarli in seguito dalla
                  pagina di modifica del deck.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-2 space-y-1.5 text-xs">
                  {cases.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-start gap-2 cursor-pointer hover:bg-white rounded-xl px-2 py-1"
                    >
                      <input
                        type="checkbox"
                        name="caseIds"
                        value={c.id}
                        className="mt-0.5 h-3 w-3"
                      />
                      <span className="flex-1">
                        <span className="font-medium text-zinc-900">{c.title}</span>
                        <span className="block text-[11px] text-zinc-500">
                          {c.specialty ?? "Specialità N/D"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/dashboard/decks">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  Annulla
                </Button>
              </Link>
              <Button type="submit" size="sm" className="text-xs px-4">
                Crea deck
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

