type EnsureResult = {
  demoUserId: string;
  demoDeckId: string;
  demoCaseIds: string[];
};

/**
 * Opzionale: crea solo l’utente demo se `ITERMED_BOOTSTRAP_DEMO=true`.
 * Non elimina dati esistenti. In produzione lasciare disattivato e usare registrazione utenti.
 */
export async function ensureBootstrapData(): Promise<EnsureResult> {
  const demoUserId = "demo-user";
  const demoDeckId = "deck_core";
  const demoCaseIds = ["demo", "cs_001", "cs_002"];

  const url = process.env.DATABASE_URL;
  if (!url || url.includes("USER:PASSWORD")) {
    return { demoUserId, demoDeckId, demoCaseIds };
  }

  if (process.env.ITERMED_BOOTSTRAP_DEMO !== "true") {
    return { demoUserId, demoDeckId, demoCaseIds };
  }

  const { prisma } = await import("./prisma");
  try {
    await prisma.user.upsert({
      where: { id: demoUserId },
      update: {},
      create: {
        id: demoUserId,
        email: "demo@itermed.local",
        name: "Dottore Demo",
        role: "STUDENT",
      },
    });
  } catch {
    return { demoUserId, demoDeckId, demoCaseIds };
  }

  return { demoUserId, demoDeckId, demoCaseIds };
}
