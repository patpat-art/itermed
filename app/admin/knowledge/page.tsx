import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { prisma } from "../../../lib/prisma";
import { getPineconeIndex } from "../../../lib/pinecone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    let chunk = normalized.slice(start, end);
    if (end < normalized.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      if (lastPeriod > chunkSize * 0.55) {
        chunk = chunk.slice(0, lastPeriod + 1);
      }
    }
    chunks.push(chunk.trim());
    if (end === normalized.length) break;
    start = end - overlap;
  }
  return chunks.filter(Boolean);
}

async function toggleGuideline(formData: FormData) {
  "use server";

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const doc = await prisma.guidelineDocument.findUnique({ where: { id } });
  if (!doc) return;

  const index = getPineconeIndex();

  const savedVectorIds = Array.isArray(doc.vectorIds) ? (doc.vectorIds as string[]) : [];

  if (doc.isActive) {
    if (index && savedVectorIds.length > 0) {
      const CHUNK = 200;
      for (let i = 0; i < savedVectorIds.length; i += CHUNK) {
        // eslint-disable-next-line no-await-in-loop
        await index.deleteMany({
          namespace: "guidelines",
          ids: savedVectorIds.slice(i, i + CHUNK),
        });
      }
    }
    await prisma.guidelineDocument.update({
      where: { id },
      data: { isActive: false },
    });
  } else {
    const chunkSize = doc.sourceType === "PDF" ? 1000 : 800;
    const overlap = doc.sourceType === "PDF" ? 200 : 120;
    const chunks = chunkText(doc.text, chunkSize, overlap);
    if (chunks.length > 0 && index) {
      const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: chunks,
      });
      const vectorIds =
        savedVectorIds.length === chunks.length
          ? savedVectorIds
          : embeddings.map((_, i) => `${doc.id}-${i}`);
      const records = embeddings.map((vector, i) => ({
        id: vectorIds[i],
        values: vector,
        metadata: {
          documentId: doc.id,
          title: doc.title,
          tags: doc.tags,
          content: chunks[i],
          ...(doc.sourceName ? { source: doc.sourceName } : {}),
        },
      }));
      if (records.length > 0) {
        await index.namespace("guidelines").upsert({ records });
      }
      await prisma.guidelineDocument.update({
        where: { id },
        data: { isActive: true, vectorIds, chunkCount: chunks.length },
      });
    }
  }

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
            Archivio linee guida caricate nel motore RAG. Puoi attivarle/disattivarle o eliminarle.
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
                  <form action={toggleGuideline}>
                    <input type="hidden" name="id" value={doc.id} />
                    <button
                      type="submit"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                        doc.isActive
                          ? "bg-emerald-500/90 border-emerald-600"
                          : "bg-zinc-200 border-zinc-300"
                      }`}
                      aria-pressed={doc.isActive}
                      title={doc.isActive ? "Disabilita guideline" : "Abilita guideline"}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                          doc.isActive ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </form>
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

