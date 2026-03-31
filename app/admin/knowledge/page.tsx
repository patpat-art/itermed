import Link from "next/link";
import { Plus, Trash2, ToggleLeft } from "lucide-react";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { getPineconeIndex } from "../../../lib/pinecone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

async function disableGuideline(formData: FormData) {
  "use server";

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const doc = await prisma.guidelineDocument.findUnique({ where: { id } });
  if (!doc) return;

  const vectorIds = Array.isArray(doc.vectorIds) ? (doc.vectorIds as string[]) : [];
  const index = getPineconeIndex();
  if (index && vectorIds.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < vectorIds.length; i += CHUNK) {
      // eslint-disable-next-line no-await-in-loop
      await index.deleteMany({
        namespace: "guidelines",
        ids: vectorIds.slice(i, i + CHUNK),
      });
    }
  }

  await prisma.guidelineDocument.update({
    where: { id },
    data: { isActive: false, vectorIds: [] },
  });

  revalidatePath("/admin/knowledge");
}

async function deleteGuideline(formData: FormData) {
  "use server";

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const doc = await prisma.guidelineDocument.findUnique({ where: { id } });
  if (!doc) return;

  const vectorIds = Array.isArray(doc.vectorIds) ? (doc.vectorIds as string[]) : [];
  const index = getPineconeIndex();
  if (index && vectorIds.length > 0) {
    const CHUNK = 200;
    for (let i = 0; i < vectorIds.length; i += CHUNK) {
      // eslint-disable-next-line no-await-in-loop
      await index.deleteMany({
        namespace: "guidelines",
        ids: vectorIds.slice(i, i + CHUNK),
      });
    }
  }

  await prisma.guidelineDocument.delete({ where: { id } });
  revalidatePath("/admin/knowledge");
}

export default async function KnowledgeAdminPage() {
  const docs = await prisma.guidelineDocument.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950">Guidelines</h1>
          <p className="text-sm text-zinc-500">
            Archivio linee guida caricate nel motore RAG. Puoi disabilitarle o eliminarle.
          </p>
        </div>
        <Link href="/admin/knowledge/new">
          <Button type="button" size="icon" variant="outline" title="Aggiungi guideline">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      <Card className="bg-white/80 border-zinc-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-950">Documenti</CardTitle>
          <CardDescription>{docs.length} linee guida archiviate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {docs.length === 0 ? (
            <p className="text-zinc-500">Nessuna guideline caricata.</p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-2 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{doc.title}</p>
                  <p className="text-xs text-zinc-500">
                    {doc.sourceType}
                    {doc.sourceName ? ` · ${doc.sourceName}` : ""}
                    {" · "}
                    {doc.chunkCount} chunk
                    {" · "}
                    {doc.isActive ? "Attiva" : "Disabilitata"}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Caricata il {doc.createdAt.toLocaleDateString("it-IT")}{" "}
                    {doc.createdAt.toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.isActive ? (
                    <form action={disableGuideline}>
                      <input type="hidden" name="id" value={doc.id} />
                      <Button type="submit" size="sm" variant="outline" className="text-xs">
                        <ToggleLeft className="h-3.5 w-3.5" />
                        Disabilita
                      </Button>
                    </form>
                  ) : null}
                  <form action={deleteGuideline}>
                    <input type="hidden" name="id" value={doc.id} />
                    <Button type="submit" size="sm" variant="outline" className="text-xs">
                      <Trash2 className="h-3.5 w-3.5" />
                      Elimina
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

