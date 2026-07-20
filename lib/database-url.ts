/**
 * Builds a Prisma-compatible PostgreSQL URL tuned for Neon connection pooling
 * (PgBouncer) in serverless / high-concurrency deployments.
 *
 * Prefer env order for runtime:
 *   DATABASE_POOL_URL → POSTGRES_PRISMA_URL → DATABASE_URL
 *
 * Neon pooled hosts contain `-pooler` (e.g. ep-xxx-pooler.region.aws.neon.tech).
 * When a direct Neon host is detected, we rewrite it to the pooler hostname and
 * append `pgbouncer=true` so Prisma does not use prepared statements incompatible
 * with transaction-mode pooling.
 */

const POOL_PARAM_DEFAULTS: Record<string, string> = {
  connection_limit: "10",
  pool_timeout: "20",
  connect_timeout: "10",
};

/** True when the URL targets Neon's pooler or explicitly enables pgbouncer. */
export function isNeonPoolerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes("-pooler.") ||
      parsed.searchParams.get("pgbouncer") === "true"
    );
  } catch {
    return url.includes("-pooler.") || url.includes("pgbouncer=true");
  }
}

/**
 * Prefer an explicitly pooled connection string when available
 * (Vercel Neon integration often sets POSTGRES_PRISMA_URL to the pooler).
 */
export function resolveRuntimeDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const candidates = [
    env.DATABASE_POOL_URL,
    env.POSTGRES_PRISMA_URL,
    env.DATABASE_URL,
    env.POSTGRES_URL,
  ];
  for (const raw of candidates) {
    if (raw?.trim()) return raw.trim();
  }
  return "";
}

/**
 * Rewrite Neon direct host → pooler host when safe:
 *   ep-cool-name.eu-central-1.aws.neon.tech
 * → ep-cool-name-pooler.eu-central-1.aws.neon.tech
 */
export function ensureNeonPoolerHostname(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname;
    if (!host.includes("neon.tech")) return rawUrl;
    if (host.includes("-pooler.")) return rawUrl;

    // Neon endpoint hosts start with `ep-`.
    if (!host.startsWith("ep-")) return rawUrl;

    const firstDot = host.indexOf(".");
    if (firstDot <= 0) return rawUrl;
    url.hostname = `${host.slice(0, firstDot)}-pooler${host.slice(firstDot)}`;
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function getPooledDatabaseUrl(rawUrl: string): string {
  if (!rawUrl?.trim()) return rawUrl;

  let working = ensureNeonPoolerHostname(rawUrl.trim());

  try {
    const url = new URL(working);

    for (const [key, value] of Object.entries(POOL_PARAM_DEFAULTS)) {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }

    // Required for Neon PgBouncer transaction pooling with Prisma.
    if (isNeonPoolerUrl(url.toString()) && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }

    // Avoid Prisma advisory locks issues behind pgbouncer (Neon recommendation).
    if (isNeonPoolerUrl(url.toString()) && !url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "10");
    }

    return url.toString();
  } catch {
    return working;
  }
}
