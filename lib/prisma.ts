import { PrismaClient } from "@prisma/client";
import { config } from "@/lib/config";
import {
  getPooledDatabaseUrl,
  isNeonPoolerUrl,
  resolveRuntimeDatabaseUrl,
} from "@/lib/database-url";
import { createLogger } from "@/lib/logger";

const prismaLogger = createLogger("prisma");

/**
 * Prevents connection exhaustion under HMR / concurrent serverless invocations
 * by reusing a single PrismaClient on `globalThis`.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const rawRuntimeUrl = resolveRuntimeDatabaseUrl() || config.DATABASE_URL;
const datasourceUrl = getPooledDatabaseUrl(rawRuntimeUrl);

if (!config.isTest && !isNeonPoolerUrl(datasourceUrl)) {
  prismaLogger.warn(
    "DATABASE_URL is not using Neon pooler (-pooler / pgbouncer=true). Under heavy load you may exhaust connections. Set DATABASE_POOL_URL or POSTGRES_PRISMA_URL to the Neon pooled connection string, or use a host containing -pooler.",
  );
} else if (!config.isTest && isNeonPoolerUrl(datasourceUrl)) {
  prismaLogger.info("Prisma datasource using Neon pooled connection");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: datasourceUrl },
    },
    log: config.isDevelopment ? ["warn", "error"] : ["error"],
  });

// Always pin on globalThis (dev HMR + serverless warm reuse).
globalForPrisma.prisma = prisma;
