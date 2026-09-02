import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCertificateBySlug, markCertificatePaid } from "@/lib/certificates";
import { vposProvider } from "@/providers/vpos";
import { slugFromId } from "@/lib/slug";
import { CURRENCY, PRICE_AMD } from "@/lib/pricing";

export const runtime = "nodejs";

/**
 * A certificate flips to `paid` only here, after signature verification —
 * never on a client redirect or success-page load (spec §7 non-negotiable).
 * Idempotent on provider_ref since V-POS acquirers retry callbacks.
 */
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await vposProvider.verifyCallback(payload);

  if (!result.ok || !result.certId) {
    // Log server-side only — never expose provider error detail to a client.
    console.error("V-POS callback failed verification", { payload });
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const certIdNum = Number(result.certId);
  const slug = slugFromId(certIdNum);
  const cert = await getCertificateBySlug(slug);

  if (!cert) {
    console.error("V-POS callback referenced unknown certificate", { certId: result.certId });
    return NextResponse.json({ error: "Unknown certificate" }, { status: 404 });
  }

  // Idempotency: if we've already recorded this provider_ref, or the
  // certificate is already paid, treat this as a harmless retry.
  const [existing] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerRef, result.providerRef))
    .limit(1);

  if (existing || cert.status === "paid") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  await db.insert(payments).values({
    certificateId: cert.id,
    provider: "vpos",
    providerRef: result.providerRef,
    amount: PRICE_AMD,
    currency: CURRENCY,
    status: "succeeded",
    rawPayload: payload as object,
  });

  await markCertificatePaid(cert.id);

  // Pre-warm the paid PNG/PDF cache so the first visitor to the certificate
  // page doesn't pay the render cost — best-effort, failure here shouldn't
  // fail the webhook (the on-demand routes will render on first request).
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    await fetch(`${base}/api/og/${slug}`).catch(() => {});
    await fetch(`${base}/api/pdf/${slug}`).catch(() => {});
  } catch {
    // best-effort only
  }

  return NextResponse.json({ ok: true });
}
