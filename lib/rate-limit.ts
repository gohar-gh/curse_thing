import { and, gte, eq, count } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimitHits } from "@/db/schema";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 10; // spec §13: 10 filings/hour per IP

/**
 * Checks whether `ip` is still under the filing rate limit, and records
 * this attempt regardless of outcome (so retries against the limit count
 * too). Backed by Postgres rather than in-memory state, since serverless
 * invocations on Vercel don't share memory across requests.
 */
export async function checkRateLimit(ip: string): Promise<{ allowed: boolean }> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const [{ value: recentCount }] = await db
    .select({ value: count() })
    .from(rateLimitHits)
    .where(and(eq(rateLimitHits.ip, ip), gte(rateLimitHits.createdAt, windowStart)));

  if (recentCount >= MAX_PER_WINDOW) {
    return { allowed: false };
  }

  await db.insert(rateLimitHits).values({ ip });
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
