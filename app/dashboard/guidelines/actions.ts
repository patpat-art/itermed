"use server";

import { revalidatePath } from "next/cache";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isDevAuthBypass } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getPineconeIndex } from "@/lib/pinecone";

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

async function assertAdmin(): Promise<boolean> {
  if (isDevAuthBypass()) return true;
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

function revalidateGuidelinesHub() {
  revalidatePath("/dashboard/guidelines");
  revalidatePath("/admin/knowledge");
}

export async function toggleGuidelineDocument(formData: FormData) {
  if (!(await assertAdmin())) return;

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
    } else {
      await prisma.guidelineDocument.update({
        where: { id },
        data: { isActive: true },
      });
    }
  }

  revalidateGuidelinesHub();
}

export async function deleteGuidelineDocument(formData: FormData) {
  if (!(await assertAdmin())) return;

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
  revalidateGuidelinesHub();
}
