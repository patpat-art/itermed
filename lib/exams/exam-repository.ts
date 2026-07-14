import type { ExamMetadata, Prisma } from "@prisma/client";
import { EXAM_DEFAULT_VALUES } from "@/lib/exam-default-values";
import { flattenCatalogExams } from "@/lib/exam-catalog-structure";
import { parseNormalRangeFromText } from "@/lib/exams/exam-range-utils";
import { prisma } from "@/lib/prisma";

export type ExamMetadataRecord = ExamMetadata;

export async function ensureExamMetadataSeeded(): Promise<void> {
  const count = await prisma.examMetadata.count();
  if (count > 0) return;

  const catalogRows = flattenCatalogExams();
  const data: Prisma.ExamMetadataCreateManyInput[] = catalogRows.map((row) => {
    const legacy = EXAM_DEFAULT_VALUES[row.id];
    const parsed = legacy ? parseNormalRangeFromText(legacy.normalFinding) : { min: null, max: null, unit: "" };

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      unit: parsed.unit,
      normalRangeMin: parsed.min,
      normalRangeMax: parsed.max,
      baseCost: legacy?.price ?? 0,
      baseTurnaroundMinutes: legacy?.routineMinutes ?? 60,
      urgencyTiming: legacy?.urgencyTiming ?? "n.p.",
      routineTiming: legacy?.routineTiming ?? "n.p.",
      normalFindingText: legacy?.normalFinding ?? "",
    };
  });

  await prisma.examMetadata.createMany({ data, skipDuplicates: true });
}

export async function listExamMetadata(filters?: {
  q?: string;
  category?: string;
}): Promise<ExamMetadata[]> {
  await ensureExamMetadataSeeded();

  const where: Prisma.ExamMetadataWhereInput = {};

  if (filters?.category) {
    where.category = { equals: filters.category, mode: "insensitive" };
  }

  if (filters?.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { normalFindingText: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.examMetadata.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getExamMetadataById(id: string): Promise<ExamMetadata | null> {
  await ensureExamMetadataSeeded();
  return prisma.examMetadata.findUnique({ where: { id } });
}

export async function createExamMetadata(
  data: Prisma.ExamMetadataCreateInput,
): Promise<ExamMetadata> {
  return prisma.examMetadata.create({ data });
}

export async function updateExamMetadata(
  id: string,
  data: Prisma.ExamMetadataUpdateInput,
): Promise<ExamMetadata> {
  return prisma.examMetadata.update({ where: { id }, data });
}

export async function getCaseExamValuesMap(
  caseId: string,
): Promise<
  Record<
    string,
    { value: number | null; isAbnormal: boolean; customCost: number | null; examId: string }
  >
> {
  const rows = await prisma.caseExamValue.findMany({
    where: { caseId },
    include: { exam: true },
  });

  const map: Record<
    string,
    { value: number | null; isAbnormal: boolean; customCost: number | null; examId: string }
  > = {};

  for (const row of rows) {
    map[row.examId] = {
      examId: row.examId,
      value: row.value,
      isAbnormal: row.isAbnormal,
      customCost: row.customCost,
    };
  }

  return map;
}

export async function listDistinctExamCategories(): Promise<string[]> {
  await ensureExamMetadataSeeded();
  const rows = await prisma.examMetadata.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}
