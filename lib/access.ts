import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Casi visibili in libreria / simulatore: propri, nel proprio deck, o in deck pubblico. */
export function visibleCasesWhere(userId: string): Prisma.ClinicalCaseWhereInput {
  return {
    isActive: true,
    OR: [
      { createdById: userId },
      { deck: { ownerId: userId } },
      { deck: { isPublic: true } },
    ],
  };
}

/** Casi che l’utente può associare a un proprio deck (non “rubare” da deck altrui privati). */
export function attachableCasesWhere(userId: string): Prisma.ClinicalCaseWhereInput {
  return {
    isActive: true,
    OR: [{ createdById: userId }, { deck: { ownerId: userId } }],
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
  const c = await prisma.clinicalCase.findUnique({
    where: { id: caseId },
    include: { deck: true },
  });
  if (!c) return false;
  if (c.createdById === userId) return true;
  if (c.deck?.ownerId === userId) return true;
  return false;
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
