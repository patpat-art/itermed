/**
 * Client-safe dashboard helpers — NO Prisma / Node imports.
 * Client components must import from here, not from `dashboard-queries`.
 */

export type CaseDifficulty = "EASY" | "MEDIUM" | "HARD";

export type CaseFilterParams = {
  specialtyId?: string;
  specialtyName?: string;
  difficulty?: CaseDifficulty;
};

export const DIFFICULTY_LABELS: Record<CaseDifficulty, string> = {
  EASY: "Facile",
  MEDIUM: "Media",
  HARD: "Difficile",
};

export function parseCaseDifficulty(value: string | undefined | null): CaseDifficulty | undefined {
  if (value === "EASY" || value === "MEDIUM" || value === "HARD") {
    return value;
  }
  return undefined;
}

export function displaySpecialtyName(caseRow: {
  specialty?: string | null;
  medicalSpecialty?: { name?: string | null } | null;
}): string {
  const fromRelation = caseRow.medicalSpecialty?.name?.trim();
  if (fromRelation) return fromRelation;
  const legacy = caseRow.specialty?.trim();
  if (legacy) return legacy;
  return "Specialità N/D";
}

export function isCaseDifficulty(value: unknown): value is CaseDifficulty {
  return value === "EASY" || value === "MEDIUM" || value === "HARD";
}
