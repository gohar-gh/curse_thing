"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { unpublishCertificateBySlug } from "@/lib/certificates";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export type UnpublishFormState = {
  message?: string;
  ok?: boolean;
};

/**
 * Gated by a shared-secret token (ADMIN_SECRET) rather than a full accounts
 * system — the product deliberately has no user accounts (spec's Notes),
 * but spec §13 still requires *some* access control on this specific
 * moderation action so it can't be triggered by anyone who finds the URL.
 *
 * Two hardenings on top of the plain token check: a constant-time
 * comparison (a naive `!==` leaks timing information an attacker could use
 * to recover the token byte-by-byte), and a strict per-IP rate limit,
 * since without one the token would otherwise be brute-forceable with
 * unlimited attempts.
 */
function safeTokenEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on mismatched lengths, so pad to equal length
  // first — the length check itself uses the (fixed-time) Buffer.length
  // comparison, not a data-dependent one.
  if (bufA.length !== bufB.length) {
    // Still compare against something of the right size so the overall
    // function takes comparable time whether or not lengths matched.
    timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function unpublishCertificate(
  _prevState: UnpublishFormState,
  formData: FormData
): Promise<UnpublishFormState> {
  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const { allowed } = await checkRateLimit(`admin:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 });
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Try again later." };
  }

  const token = String(formData.get("token") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return { ok: false, message: "ADMIN_SECRET is not configured on the server." };
  }
  if (!safeTokenEquals(token, adminSecret)) {
    return { ok: false, message: "Incorrect token." };
  }
  if (!slug) {
    return { ok: false, message: "Enter a certificate slug." };
  }

  const result = await unpublishCertificateBySlug(slug);
  if (!result) {
    return { ok: false, message: `No certificate found with slug "${slug}".` };
  }

  return { ok: true, message: `Certificate ${slug} unpublished.` };
}
