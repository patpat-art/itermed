import { getDevMockUser, isDevAuthBypass } from "./require-user";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "./prisma";

let mockUserBootstrap: Promise<string> | null = null;

/** Crea o aggiorna l'utente mock nel DB (FK-safe per Prisma). */
async function ensureMockDevUserInDb(): Promise<string> {
  const mock = getDevMockUser();

  const user = await prisma.user.upsert({
    where: { id: mock.id },
    create: {
      id: mock.id,
      email: mock.email!,
      name: mock.name,
      role: "ADMIN",
    },
    update: {
      email: mock.email!,
      name: mock.name,
      role: "ADMIN",
    },
  });

  return user.id;
}

function bootstrapMockDevUserId(): Promise<string> {
  if (!mockUserBootstrap) {
    mockUserBootstrap = ensureMockDevUserInDb().catch((error) => {
      mockUserBootstrap = null;
      throw error;
    });
  }
  return mockUserBootstrap;
}

/**
 * Restituisce l'userId della sessione corrente.
 * In development usa sempre il mock user (creato via upsert su PostgreSQL).
 */
export async function getSessionUserId(): Promise<string | null> {
  if (isDevAuthBypass()) {
    return bootstrapMockDevUserId();
  }

  const session = await getServerSession(authOptions);
  return session?.user?.id?.trim() || null;
}
