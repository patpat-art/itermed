/**
 * Builds a Prisma-compatible PostgreSQL URL tuned for Neon connection pooling
 * in serverless / high-concurrency deployments.
 */
export function getPooledDatabaseUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    // Neon pooler endpoint (hostname contains `-pooler`) reuses connections efficiently.
    // These params prevent "Too many connections" under load (Prisma + serverless guidance).
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "10");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "10");
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

/** Returns true when the URL targets Neon's pooler (recommended for runtime queries). */
export function isNeonPoolerUrl(url: string): boolean {
  return url.includes("-pooler.") || url.includes("pgbouncer=true");
}
