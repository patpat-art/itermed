import type { Prisma } from "@prisma/client";

/** Casi visibili: globali + individuali dell'utente. */
export function visibleCasesWhere(userId: string): Prisma.ClinicalCaseWhereInput {
  return {
    isActive: true,
    OR: [{ createdById: userId }, { isGlobal: true }],
  };
}

/** Casi che l'utente può gestire/associare: solo i propri individuali. */
export function attachableCasesWhere(userId: string): Prisma.ClinicalCaseWhereInput {
  return {
    isActive: true,
    createdById: userId,
  };
}
