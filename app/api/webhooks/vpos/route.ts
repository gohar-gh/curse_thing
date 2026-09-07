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
 * This is Ameriabank vPOS's BackURL — the customer's browser lands here
 * via a GET redirect after paying (or failing to), carrying
 * orderID/paymentID/resposneCode as query params. Per spec §7, a
 * certificate flips to `paid` only after independent server-side
 * verification — here that's `verifyCallback`'s authenticated
 * GetPaymentDetails call, not the query params themselves, since Ameriabank
 * has no separate async webhook for this protocol (see providers/vpos.ts).
 * Idempotent on provider_ref (paymentID) in case the browser reloads or
 * double-lands on this URL.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const payload = Object.fromEntries(searchParams.entries());

  const result = await vposProvider.verifyCallback(payload);

  if (!result.certId) {
    console.error("V-POS callback missing orderID/paymentID", { payload });
    return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  }

  const certIdNum = Number(result.certId);
  const slug = slugFromId(certIdNum);
  const cert = await getCertificateBySlug(slug);

  if (!cert) {
    console.error("V-POS callback referenced unknown certificate", { certId: result.certId });
    return NextResponse.json({ error: "Unknown certificate" }, { status: 404 });
  }

  if (!result.ok) {
    // Log server-side only — never expose provider error detail to the
    // client. User-facing copy lives on the cert page for ?payment=failed.
    console.error("V-POS payment not completed", { payload });
    return NextResponse.redirect(`${req.nextUrl.origin}/c/${slug}?payment=failed`);
  }

  // Idempotency: if we've already recorded this provider_ref, or the
  // certificate is already paid, treat this as a harmless repeat visit.
  const [existing] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerRef, result.providerRef))
    .limit(1);

  if (!existing && cert.status !== "paid") {
    await db.insert(payments).values({
      certificateId: cert.id,
      provider: "vpos",
      providerRef: result.providerRef,
      amount: PRICE_AMD,
      currency: CURRENCY,
      status: "succeeded",
      rawPayload: payload,
    });

    await markCertificatePaid(cert.id);

    // Pre-warm the paid PNG/PDF cache so the first visitor to the
    // certificate page doesn't pay the render cost — best-effort, failure
    // here shouldn't break the redirect (routes render on-demand anyway).
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    fetch(`${base}/api/og/${slug}`).catch(() => {});
    fetch(`${base}/api/pdf/${slug}`).catch(() => {});
  }

  return NextResponse.redirect(`${req.nextUrl.origin}/c/${slug}`);
}
