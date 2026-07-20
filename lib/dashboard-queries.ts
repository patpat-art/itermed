import type { CaseDifficulty, Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { visibleCasesWhere } from "@/lib/access-queries";
import { prisma } from "@/lib/prisma";

export type CaseFilterParams = {
  specialtyId?: string;
  specialtyName?: string;
  difficulty?: CaseDifficulty;
};

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

export const DIFFICULTY_LABELS: Record<CaseDifficulty, string> = {
  EASY: "Facile",
  MEDIUM: "Media",
  HARD: "Difficile",
};

/** Loads visible clinical cases with MedicalSpecialty relation for dashboard views. */
export async function fetchFilteredClinicalCases(
  userId: string,
  filters?: CaseFilterParams,
  take = 50,
) {
  return prisma.clinicalCase.findMany({
    where: filteredCasesWhere(userId, filters),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      difficulty: true,
      specialty: true,
      isGlobal: true,
      medicalSpecialty: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take,
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

export function parseCaseDifficulty(value: string | undefined): CaseDifficulty | undefined {
  if (value === "EASY" || value === "MEDIUM" || value === "HARD") {
    return value;
  }
  return undefined;
}

export function displaySpecialtyName(caseRow: {
  specialty: string | null;
  medicalSpecialty?: { name: string } | null;
}): string {
  return caseRow.medicalSpecialty?.name ?? caseRow.specialty ?? "Specialità N/D";
}
