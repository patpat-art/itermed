import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { visibleCasesWhere } from "@/lib/access-queries";
import { prisma } from "@/lib/prisma";
import {
  type CaseDifficulty,
  type CaseFilterParams,
  DIFFICULTY_LABELS,
  displaySpecialtyName,
  parseCaseDifficulty,
} from "@/lib/dashboard-case-utils";

export type { CaseDifficulty, CaseFilterParams };
export { DIFFICULTY_LABELS, displaySpecialtyName, parseCaseDifficulty };

export function filteredCasesWhere(
  userId: string,
  filters?: CaseFilterParams,
): Prisma.ClinicalCaseWhereInput {
  const specialtyNameFilter = filters?.specialtyName?.trim();

  return {
    ...visibleCasesWhere(userId),
    ...(filters?.specialtyId ? { medicalSpecialtyId: filters.specialtyId } : {}),
    ...(specialtyNameFilter
      ? {
          OR: [
            {
              medicalSpecialty: {
                name: { equals: specialtyNameFilter, mode: "insensitive" },
              },
            },
            { specialty: { equals: specialtyNameFilter, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters?.difficulty ? { difficulty: filters.difficulty } : {}),
  };
}

/** Loads visible clinical cases with MedicalSpecialty relation for dashboard views. */
export async function fetchFilteredClinicalCases(
  userId: string,
  filters?: CaseFilterParams,
  take = 50,
) {
  const rows = await prisma.clinicalCase.findMany({
    where: filteredCasesWhere(userId, filters),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      difficulty: true,
      specialty: true,
      isGlobal: true,
      createdById: true,
      baselineExamFindings: true,
      medicalSpecialty: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take,
  });

  return rows.map((row) => {
    const baseline = row.baselineExamFindings as
      | { demographics?: { sex?: string | null } }
      | null
      | undefined;
    const sex = baseline?.demographics?.sex ?? null;
    const { baselineExamFindings: _omit, ...rest } = row;
    return { ...rest, sex };
  });
}

/** All medical specialties for dynamic filter badges. */
export async function fetchMedicalSpecialtyOptions() {
  return prisma.medicalSpecialty.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Shared specialty list — cached across requests (not user-specific).
 * Revalidates every 5 minutes to keep Prassi filters snappy under load.
 */
export const fetchMedicalSpecialtyOptionsCached = unstable_cache(
  async () => fetchMedicalSpecialtyOptions(),
  ["medical-specialty-options-v1"],
  { revalidate: 300, tags: ["medical-specialties"] },
);
