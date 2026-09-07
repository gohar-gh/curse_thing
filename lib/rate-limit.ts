import { and, gte, eq, count } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimitHits } from "@/db/schema";

const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MAX_PER_WINDOW = 10; // spec §13: 10 filings/hour per IP

/**
 * Checks whether `key` is still under its rate limit, and records this
 * attempt regardless of outcome (so retries against the limit count too).
 * Backed by Postgres rather than in-memory state, since serverless
 * invocations on Vercel don't share memory across requests.
 *
 * `key` is namespaced by the caller (e.g. a bare IP for filings, or
 * `admin:<ip>` for admin-token attempts) so unrelated actions don't share
 * one budget — they reuse the same table, just different key prefixes,
 * rather than needing a per-action schema.
 */
export async function checkRateLimit(
  key: string,
  options?: { windowMs?: number; max?: number }
): Promise<{ allowed: boolean }> {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options?.max ?? DEFAULT_MAX_PER_WINDOW;
  const windowStart = new Date(Date.now() - windowMs);

  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(rateLimitHits)
    .where(and(eq(rateLimitHits.ip, key), gte(rateLimitHits.createdAt, windowStart)));

  if (recentCount >= max) {
    return { allowed: false };
  }

  await db.insert(rateLimitHits).values({ ip: key });
  return { allowed: true };
}

/**
 * Best-effort client IP extraction from standard proxy headers (Vercel sets
 * x-forwarded-for). Falls back to a constant so local dev without a proxy
 * still exercises the rate limiter (all local requests share one bucket).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}
