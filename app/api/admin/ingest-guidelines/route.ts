import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { z } from "zod";
import { getPineconeIndex } from "../../../../lib/pinecone";
import { requireAdminApi } from "../../../../lib/require-admin-api";
import { prisma } from "../../../../lib/prisma";

const IngestBodySchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 120;

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const index = getPineconeIndex();
  if (!index) {
    return new Response(
      JSON.stringify({
        error:
          "Pinecone non è configurato. Imposta PINECONE_API_KEY e PINECONE_INDEX per usare l'ingestion.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const json = await req.json();
  const parsed = IngestBodySchema.safeParse(json);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, text, tags = [] } = parsed.data;

  // 1. Chunking semplice a lunghezza fissa con overlap
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];

  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    let chunk = normalized.slice(start, end);

    // evita di troncare in mezzo a una frase quando possibile
    if (end < normalized.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      if (lastPeriod > CHUNK_SIZE * 0.6) {
        chunk = chunk.slice(0, lastPeriod + 1);
      }
    }

    chunks.push(chunk.trim());
    if (end === normalized.length) break;
    start = end - CHUNK_OVERLAP;
  }

  if (chunks.length === 0) {
    return new Response(
      JSON.stringify({ error: "Nessun contenuto valido da indicizzare." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // 2. Embedding dei chunk
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
    });

    // 3. Upsert su Pinecone
    const namespace = "guidelines";
    const docId = crypto.randomUUID();
    const vectorIds = embeddings.map((_, i) => `${docId}-${i}`);

    const records = embeddings.map((vector, i) => ({
      id: vectorIds[i],
      values: vector,
      metadata: {
        documentId: docId,
        title,
        tags,
        content: chunks[i],
      },
    }));

    if (records.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Nessun vettore valido generato per l'indicizzazione. Verifica che il testo non sia vuoto o troppo corto.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      console.log("Pinecone guidelines upsert records length:", records.length);
      await index.namespace(namespace).upsert({ records });
    } catch (err: any) {
      console.error("Pinecone upsert failed for guidelines:", err?.message ?? err);
      return new Response(
        JSON.stringify({
          status: "partial",
          chunks: chunks.length,
          warning:
            "Testo elaborato ma non indicizzato correttamente in Pinecone. Verifica configurazione Pinecone/SDK.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    await prisma.guidelineDocument.create({
      data: {
        id: docId,
        title,
        tags,
        sourceType: "TEXT",
        text: normalized,
        chunkCount: chunks.length,
        vectorIds,
        isActive: true,
      },
    });

    return new Response(
      JSON.stringify({
        status: "ok",
        chunks: chunks.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error:
          error?.message ??
          "Errore imprevisto durante l'embedding del testo o l'upsert in Pinecone.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

