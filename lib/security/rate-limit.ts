type RateBucket = {
  count: number;
  resetAt: number;
};

export const RATE_LIMIT_MESSAGE =
  "Hai superato il limite di richieste consentite. Riprova tra un minuto.";

const WINDOW_MS = 60_000;
const buckets = new Map<string, RateBucket>();

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function getRateLimitIdentifier(request: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";

  return `ip:${ip}`;
}

export type RateLimitCheckResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * In-memory sliding window limiter for serverless/dev fallback.
 * For distributed production limits, add @upstash/ratelimit + Redis env keys.
 */
export function checkInMemoryRateLimit(
  key: string,
  limit: number,
  windowMs = WINDOW_MS,
): RateLimitCheckResult {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true };
}

export function rateLimitExceededResponse(retryAfterSeconds = 60): Response {
  return new Response(JSON.stringify({ error: RATE_LIMIT_MESSAGE }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

export function enforceRateLimit(
  request: Request,
  params: { namespace: string; limit: number; userId?: string | null },
): Response | null {
  const identifier = getRateLimitIdentifier(request, params.userId);
  const key = `${params.namespace}:${identifier}`;
  const result = checkInMemoryRateLimit(key, params.limit);

  if (!result.allowed) {
    return rateLimitExceededResponse(result.retryAfterSeconds);
  }

  return null;
}
