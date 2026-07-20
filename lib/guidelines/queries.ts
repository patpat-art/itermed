import { prisma } from "@/lib/prisma";

export type GuidelineListItem = {
  id: string;
  title: string;
  tags: string[];
  sourceType: string;
  sourceName: string | null;
  chunkCount: number;
  isActive: boolean;
  createdAt: Date;
};

export type GuidelineDetailItem = GuidelineListItem & {
  text: string;
};

const guidelineListSelect = {
  id: true,
  title: true,
  tags: true,
  sourceType: true,
  sourceName: true,
  chunkCount: true,
  isActive: true,
  createdAt: true,
} as const;

const guidelineDetailSelect = {
  ...guidelineListSelect,
  text: true,
} as const;

export async function fetchGuidelineDocuments(options?: {
  activeOnly?: boolean;
  id?: string;
  /** Include full document text (dashboard preview). Omit for lightweight API list. */
  includeText?: boolean;
}): Promise<Array<GuidelineListItem | GuidelineDetailItem>> {
  const includeText = options?.includeText ?? false;

  return prisma.guidelineDocument.findMany({
    where: {
      ...(options?.activeOnly ? { isActive: true } : {}),
      ...(options?.id ? { id: options.id } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: includeText ? guidelineDetailSelect : guidelineListSelect,
  });
}

export async function fetchGuidelineDocumentById(id: string): Promise<GuidelineDetailItem | null> {
  return prisma.guidelineDocument.findUnique({
    where: { id },
    select: guidelineDetailSelect,
  });
}
