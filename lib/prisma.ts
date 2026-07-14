import { PrismaClient } from "@prisma/client";
import { config } from "@/lib/config";
import { getPooledDatabaseUrl } from "@/lib/database-url";
import { createLogger } from "@/lib/logger";

const prismaLogger = createLogger("prisma");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const datasourceUrl = getPooledDatabaseUrl(config.DATABASE_URL);

if (!config.isTest && !config.DATABASE_URL.includes("-pooler.")) {
  prismaLogger.warn(
    "DATABASE_URL does not use Neon pooler host (-pooler). Under high load you may hit connection limits; use the pooled connection string from Neon dashboard.",
  );
}

/**
 * Singleton Prisma client — cached on `globalThis` in all environments
 * to maximise connection reuse across hot serverless invocations.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: datasourceUrl },
    },
    log: config.isDevelopment ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
