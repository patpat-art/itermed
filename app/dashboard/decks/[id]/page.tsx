import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Settings, Trash2 } from "lucide-react";
import { prisma } from "../../../../lib/prisma";
import { attachableCasesWhere, userCanManageCase, userOwnsDeck } from "../../../../lib/access";
import { requireUser } from "../../../../lib/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import { Button } from "../../../ui/button";

async function updateDeck(formData: FormData) {
  "use server";

  const user = await requireUser();
  const id = formData.get("id");
  const title = formData.get("title");
  const description = formData.get("description");
  const visibility = formData.get("visibility");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("ID deck mancante.");
  }
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Il titolo del deck è obbligatorio.");
  }

  const isPublic = visibility === "public";

  const owned = await userOwnsDeck(user.id, id);
  if (!owned) redirect("/dashboard/decks");

  await prisma.caseDeck.update({
    where: { id },
    data: {
      title: title.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      isPublic,
    },
  });

  redirect("/dashboard/decks");
}

async function attachCase(formData: FormData) {
  "use server";

  const user = await requireUser();
  const deckId = formData.get("deckId");
  const caseId = formData.get("caseId");

  if (typeof deckId !== "string" || !deckId.trim()) {
    throw new Error("ID deck mancante.");
  }
  if (typeof caseId !== "string" || !caseId.trim()) {
    throw new Error("ID caso mancante.");
  }

  const deckOk = await userOwnsDeck(user.id, deckId);
  const caseOk = await userCanManageCase(user.id, caseId);
  if (!deckOk || !caseOk) redirect("/dashboard/decks");

  await prisma.clinicalCase.update({
    where: { id: caseId },
    data: { deckId },
  });

  redirect(`/dashboard/decks/${deckId}`);
}

async function detachCase(formData: FormData) {
  "use server";

  const user = await requireUser();
  const deckId = formData.get("deckId");
  const caseId = formData.get("caseId");

  if (typeof deckId !== "string" || !deckId.trim()) {
    throw new Error("ID deck mancante.");
  }
  if (typeof caseId !== "string" || !caseId.trim()) {
    throw new Error("ID caso mancante.");
  }

  const owned = await userOwnsDeck(user.id, deckId);
  if (!owned) redirect("/dashboard/decks");

  await prisma.clinicalCase.update({
    where: { id: caseId, deckId },
    data: { deckId: null },
  });

  redirect(`/dashboard/decks/${deckId}`);
}

async function deleteDeck(formData: FormData) {
  "use server";

  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("ID deck mancante.");
  }

  const owned = await userOwnsDeck(user.id, id);
  if (!owned) redirect("/dashboard/decks");

  await prisma.clinicalCase.updateMany({
    where: { deckId: id },
    data: { deckId: null },
  });

  await prisma.caseDeck.delete({
    where: { id },
  });

  redirect("/dashboard/decks");
}

async function createCaseInDeck(formData: FormData) {
  "use server";

  const user = await requireUser();
  const deckId = formData.get("deckId");
  const title = formData.get("title");
  const description = formData.get("description");
  const specialty = formData.get("specialty");
  const difficulty = formData.get("difficulty");

  const fc = formData.get("vitals_fc");
  const pa = formData.get("vitals_pa");
  const spo2 = formData.get("vitals_spo2");
  const temp = formData.get("vitals_temp");
  const fr = formData.get("vitals_fr");

  if (typeof deckId !== "string" || !deckId.trim()) {
    throw new Error("ID deck mancante.");
  }
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Il titolo del caso è obbligatorio.");
  }
  if (typeof description !== "string" || !description.trim()) {
    throw new Error("La descrizione del caso è obbligatoria.");
  }

  const ownedDeck = await userOwnsDeck(user.id, deckId);
  if (!ownedDeck) redirect("/dashboard/decks");

  const baselineExamFindings: any = {
    vitals: {
      heartRate: fc && typeof fc === "string" && fc.trim() ? Number(fc) || fc : null,
      bloodPressure: pa && typeof pa === "string" && pa.trim() ? pa.trim() : null,
      spo2: spo2 && typeof spo2 === "string" && spo2.trim() ? Number(spo2) || spo2 : null,
      temperature:
        temp && typeof temp === "string" && temp.trim() ? Number(temp) || temp : null,
      respiratoryRate:
        fr && typeof fr === "string" && fr.trim() ? Number(fr) || fr : null,
    },
  };

  await prisma.clinicalCase.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      specialty:
        typeof specialty === "string" && specialty.trim() ? specialty.trim() : null,
      difficulty:
        difficulty === "EASY" || difficulty === "HARD" || difficulty === "MEDIUM"
          ? difficulty
          : "MEDIUM",
      isActive: true,
      deckId,
      createdById: user.id,
      baselineExamFindings,
    },
  });

  redirect(`/dashboard/decks/${deckId}`);
}

async function updateCaseInDeck(formData: FormData) {
  "use server";

  const user = await requireUser();
  const caseId = formData.get("caseId");
  const deckId = formData.get("deckId");
  const title = formData.get("title");
  const description = formData.get("description");
  const specialty = formData.get("specialty");
  const difficulty = formData.get("difficulty");

  const fc = formData.get("vitals_fc");
  const pa = formData.get("vitals_pa");
  const spo2 = formData.get("vitals_spo2");
  const temp = formData.get("vitals_temp");
  const fr = formData.get("vitals_fr");

  if (typeof caseId !== "string" || !caseId.trim()) {
    throw new Error("ID caso mancante.");
  }
  if (typeof deckId !== "string" || !deckId.trim()) {
    throw new Error("ID deck mancante.");
  }
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Il titolo del caso è obbligatorio.");
  }
  if (typeof description !== "string" || !description.trim()) {
    throw new Error("La descrizione del caso è obbligatoria.");
  }

  const owned = await userOwnsDeck(user.id, deckId);
  if (!owned) redirect("/dashboard/decks");

  const existing = await prisma.clinicalCase.findFirst({
    where: { id: caseId, deckId },
  });
  if (!existing) redirect(`/dashboard/decks/${deckId}`);

  const baselineExamFindings: any = {
    vitals: {
      heartRate: fc && typeof fc === "string" && fc.trim() ? Number(fc) || fc : null,
      bloodPressure: pa && typeof pa === "string" && pa.trim() ? pa.trim() : null,
      spo2: spo2 && typeof spo2 === "string" && spo2.trim() ? Number(spo2) || spo2 : null,
      temperature:
        temp && typeof temp === "string" && temp.trim() ? Number(temp) || temp : null,
      respiratoryRate:
        fr && typeof fr === "string" && fr.trim() ? Number(fr) || fr : null,
    },
  };

  await prisma.clinicalCase.update({
    where: { id: caseId },
    data: {
      title: title.trim(),
      description: description.trim(),
      specialty:
        typeof specialty === "string" && specialty.trim() ? specialty.trim() : null,
      difficulty:
        difficulty === "EASY" || difficulty === "HARD" || difficulty === "MEDIUM"
          ? difficulty
          : "MEDIUM",
      baselineExamFindings,
    },
  });

  redirect(`/dashboard/decks/${deckId}`);
}

export default async function DeckEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: deckId } = await params;
  if (!deckId) return notFound();

  const user = await requireUser();

  const [deck, allCases] = await Promise.all([
    prisma.caseDeck.findUnique({
      where: { id: deckId },
      include: { cases: true, _count: { select: { cases: true } } },
    }),
    prisma.clinicalCase.findMany({
      where: attachableCasesWhere(user.id),
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  if (!deck) {
    return notFound();
  }

  if (deck.ownerId !== user.id) {
    return notFound();
  }

  const attachedCaseIds = new Set(deck.cases.map((c) => c.id));
  const availableCases = allCases.filter((c) => !attachedCaseIds.has(c.id));

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Deck & casi</h1>
        <p className="text-sm text-zinc-400">
          Gestisci titolo e visibilità del deck, modifica i casi associati e aggiungine di nuovi
          con dati di esame obiettivo di base.
        </p>
      </header>

      <Card className="bg-white/80 border-zinc-200/80 max-w-5xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-950">
              Casi nel deck
            </CardTitle>
            <CardDescription>
              Modifica i casi associati o scollegali. La rimozione non elimina il caso dal database.
            </CardDescription>
          </div>
          <Link href="#new-case" className="shrink-0" title="Aggiungi nuovo caso">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
          <CardContent className="text-xs space-y-2">
            {deck.cases.length === 0 ? (
              <p className="text-zinc-500">
                Nessun caso ancora collegato. Aggiungine uno dal modulo a destra o collega un caso
                esistente.
              </p>
            ) : (
              <div className="space-y-2">
                {deck.cases.map((c) => {
                  const vitals = (c as any).baselineExamFindings?.vitals ?? {};
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-950">{c.title}</p>
                          <p className="text-[11px] text-zinc-500">
                            {c.specialty ?? "Specialità N/D"} · Difficoltà: {c.difficulty}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            title="Modifica caso"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <form action={detachCase}>
                            <input type="hidden" name="deckId" value={deck.id} />
                            <input type="hidden" name="caseId" value={c.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="icon"
                              className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              title="Scollega caso dal deck"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </div>

                      <form
                        action={updateCaseInDeck}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-100/80 mt-1"
                      >
                        <input type="hidden" name="caseId" value={c.id} />
                        <input type="hidden" name="deckId" value={deck.id} />

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-zinc-700" htmlFor={`case-title-${c.id}`}>
                            Titolo caso
                          </label>
                          <Input
                            id={`case-title-${c.id}`}
                            name="title"
                            defaultValue={c.title}
                            required
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-zinc-700" htmlFor={`case-specialty-${c.id}`}>
                            Specialità
                          </label>
                          <Input
                            id={`case-specialty-${c.id}`}
                            name="specialty"
                            defaultValue={c.specialty ?? ""}
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[11px] font-medium text-zinc-700" htmlFor={`case-description-${c.id}`}>
                            Descrizione
                          </label>
                          <Textarea
                            id={`case-description-${c.id}`}
                            name="description"
                            rows={2}
                            defaultValue={c.description}
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-zinc-700">
                            Difficoltà
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            {["EASY", "MEDIUM", "HARD"].map((level) => (
                              <label key={level} className="inline-flex items-center gap-1.5">
                                <input
                                  type="radio"
                                  name="difficulty"
                                  value={level}
                                  defaultChecked={c.difficulty === level}
                                  className="h-3 w-3"
                                />
                                <span>{level}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-zinc-700">
                            Parametri vitali di base
                          </span>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <Input
                              name="vitals_fc"
                              placeholder="FC"
                              defaultValue={vitals.heartRate ?? ""}
                              className="h-7 px-2"
                            />
                            <Input
                              name="vitals_pa"
                              placeholder="PA"
                              defaultValue={vitals.bloodPressure ?? ""}
                              className="h-7 px-2"
                            />
                            <Input
                              name="vitals_spo2"
                              placeholder="SpO₂"
                              defaultValue={vitals.spo2 ?? ""}
                              className="h-7 px-2"
                            />
                            <Input
                              name="vitals_temp"
                              placeholder="Temp °C"
                              defaultValue={vitals.temperature ?? ""}
                              className="h-7 px-2"
                            />
                            <Input
                              name="vitals_fr"
                              placeholder="FR"
                              defaultValue={vitals.respiratoryRate ?? ""}
                              className="h-7 px-2"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end">
                          <Button
                            type="submit"
                            size="sm"
                            className="text-[11px] px-3 py-1"
                          >
                            Salva caso
                          </Button>
                        </div>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 max-w-5xl">
        <div />
        <Card className="bg-white/80 border-zinc-200/80" id="new-case">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-950">
              Nuovo caso nel deck
            </CardTitle>
            <CardDescription>
              Crea rapidamente un nuovo caso associato al deck, includendo già i parametri vitali di
              base.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs">
            <form action={createCaseInDeck} className="space-y-3">
              <input type="hidden" name="deckId" value={deck.id} />

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-700" htmlFor="new-title">
                  Titolo caso
                </label>
                <Input
                  id="new-title"
                  name="title"
                  required
                  placeholder="Es. Dolore toracico in PS"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-700" htmlFor="new-specialty">
                  Specialità
                </label>
                <Input
                  id="new-specialty"
                  name="specialty"
                  placeholder="Es. Emergenza / Cardiologia"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-[11px] font-medium text-zinc-700"
                  htmlFor="new-description"
                >
                  Descrizione
                </label>
                <Textarea
                  id="new-description"
                  name="description"
                  rows={2}
                  placeholder="Breve descrizione del caso e dell'obiettivo formativo..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-700">Difficoltà</span>
                <div className="flex items-center gap-2 text-[11px]">
                  {["EASY", "MEDIUM", "HARD"].map((level) => (
                    <label key={level} className="inline-flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        defaultChecked={level === "MEDIUM"}
                        className="h-3 w-3"
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-700">
                  Parametri vitali di base
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <Input
                    name="vitals_fc"
                    placeholder="FC"
                    className="h-7 px-2"
                  />
                  <Input
                    name="vitals_pa"
                    placeholder="PA"
                    className="h-7 px-2"
                  />
                  <Input
                    name="vitals_spo2"
                    placeholder="SpO₂"
                    className="h-7 px-2"
                  />
                  <Input
                    name="vitals_temp"
                    placeholder="Temp °C"
                    className="h-7 px-2"
                  />
                  <Input
                    name="vitals_fr"
                    placeholder="FR"
                    className="h-7 px-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" size="sm" className="text-[11px] px-3 py-1.5">
                  Crea caso
                </Button>
              </div>
            </form>

            {availableCases.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-200/80 space-y-1.5">
                <p className="text-[11px] font-medium text-zinc-700">
                  Collega caso esistente
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {availableCases.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-950 text-xs">{c.title}</p>
                        <p className="text-[11px] text-zinc-500">
                          {c.specialty ?? "Specialità N/D"}
                        </p>
                      </div>
                      <form action={attachCase}>
                        <input type="hidden" name="deckId" value={deck.id} />
                        <input type="hidden" name="caseId" value={c.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="text-[11px] px-3 py-1"
                        >
                          Aggiungi
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 border-zinc-200/80 max-w-xl">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">
            Impostazioni deck
          </CardTitle>
          <CardDescription>
            Titolo, descrizione e visibilità del deck. Le modifiche sono applicate immediatamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="deck-update-form" action={updateDeck} className="space-y-4">
            <input type="hidden" name="id" value={deck.id} />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700" htmlFor="title">
                Titolo
              </label>
              <Input
                id="title"
                name="title"
                defaultValue={deck.title}
                required
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
                defaultValue={deck.description ?? ""}
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
                    defaultChecked={deck.isPublic}
                    className="h-3 w-3"
                  />
                  <span>Pubblico</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    defaultChecked={!deck.isPublic}
                    className="h-3 w-3"
                  />
                  <span>Privato</span>
                </label>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between gap-3 pt-2">
            <form action={deleteDeck} className="inline">
              <input type="hidden" name="id" value={deck.id} />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                title="Elimina deck"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center gap-2">
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
              <Button
                type="submit"
                form="deck-update-form"
                size="sm"
                className="text-xs px-4"
              >
                Salva modifiche
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

