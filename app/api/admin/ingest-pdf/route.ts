import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { z } from "zod";
import { getPineconeIndex } from "../../../../lib/pinecone";
import { requireAdminApi } from "../../../../lib/require-admin-api";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const FormSchema = z.object({
  title: z.string().min(1),
  tags: z.string().optional(),
});

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];

  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + size, normalized.length);
    let chunk = normalized.slice(start, end);

    if (end < normalized.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      if (lastPeriod > size * 0.5) {
        chunk = chunk.slice(0, lastPeriod + 1);
      }
    }

    chunks.push(chunk.trim());
    if (end === normalized.length) break;
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 0);
}

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const index = getPineconeIndex();
  if (!index) {
    return new Response(
      JSON.stringify({
        error:
          "Pinecone non è configurato. Imposta PINECONE_API_KEY e PINECONE_INDEX per usare questa API.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const formData = await req.formData();
    const rawTitle = formData.get("title");
    const rawTags = formData.get("tags");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "File PDF mancante." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parsedMeta = FormSchema.safeParse({
      title: typeof rawTitle === "string" ? rawTitle : "",
      tags: typeof rawTags === "string" ? rawTags : "",
    });

    if (!parsedMeta.success) {
      return new Response(JSON.stringify({ error: parsedMeta.error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { title, tags } = parsedMeta.data;
    const tagsArray = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // 1. Estrazione testo dal PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // import dinamico per evitare problemi con l'export ESM/CommonJS
    const pdfModule = await import("pdf-parse");
    const candidates = [
      (pdfModule as any).default,
      (pdfModule as any).default?.default,
      pdfModule,
    ];
    const pdfParseFn = candidates.find((c) => typeof c === "function");
    if (!pdfParseFn) {
      throw new Error(
        "Impossibile utilizzare pdf-parse in questo ambiente. Verifica la versione del pacchetto.",
      );
    }
    const pdfData = await (pdfParseFn as (buf: Buffer) => Promise<any>)(buffer);
    const rawText = pdfData.text?.trim();

    if (!rawText || rawText.length < 20) {
      return new Response(
        JSON.stringify({
          error:
            "Impossibile estrarre testo dal PDF. Il documento potrebbe essere solo un'immagine scannerizzata senza OCR.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. Chunking
    const chunks = chunkText(rawText);
    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Nessun contenuto utile estratto dal PDF.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Embedding
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
    });

    // 4. Upsert su Pinecone a batch
    const namespace = "guidelines";
    const docId = crypto.randomUUID();
    const vectorIds = embeddings.map((_, i) => `${docId}-${i}`);
    const BATCH_SIZE = 64;

    for (let i = 0; i < embeddings.length; i += BATCH_SIZE) {
      const batchRecords = embeddings.slice(i, i + BATCH_SIZE).map((vector, localIndex) => {
        const globalIndex = i + localIndex;
        return {
          id: vectorIds[globalIndex],
          values: vector,
          metadata: {
            documentId: docId,
            title,
            tags: tagsArray,
            content: chunks[globalIndex],
            source: file.name,
          },
        };
      });

      if (batchRecords.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      console.log("Pinecone PDF upsert batchRecords length:", batchRecords.length);
      await index.namespace(namespace).upsert({ records: batchRecords });
    }

    await prisma.guidelineDocument.create({
      data: {
        id: docId,
        title,
        tags: tagsArray,
        sourceType: "PDF",
        sourceName: file.name,
        text: rawText,
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
          "Errore imprevisto durante l'analisi del PDF e l'indicizzazione in Pinecone.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

