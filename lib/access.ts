import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Casi visibili: globali (deck pubblico) + individuali dell'utente. */
export function visibleCasesWhere(userId: string): Prisma.ClinicalCaseWhereInput {
  return {
    isActive: true,
    OR: [{ createdById: userId }, { isGlobal: true }],
  };
}

/** Casi che l’utente può gestire/associare: solo i propri individuali. */
export function attachableCasesWhere(userId: string): Prisma.ClinicalCaseWhereInput {
  return {
    isActive: true,
    createdById: userId,
  };
}

export async function userCanPlayCase(userId: string, caseId: string): Promise<boolean> {
  const n = await prisma.clinicalCase.count({
    where: { id: caseId, ...visibleCasesWhere(userId) },
  });
  return n > 0;
}

export async function userOwnsDeck(userId: string, deckId: string): Promise<boolean> {
  const n = await prisma.caseDeck.count({ where: { id: deckId, ownerId: userId } });
  return n > 0;
}

export async function userCanManageCase(userId: string, caseId: string): Promise<boolean> {
  const c = await prisma.clinicalCase.findUnique({ where: { id: caseId } });
  if (!c) return false;
  return c.createdById === userId;
}

export async function verifyLiveSessionOwner(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const row = await prisma.caseSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });
  return row?.userId === userId;
}
