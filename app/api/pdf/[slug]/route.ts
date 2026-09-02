import { NextRequest, NextResponse } from "next/server";
import { getCertificateBySlug } from "@/lib/certificates";
import { buildCertificateStrings } from "@/lib/certificate-strings";
import { renderCertificatePdf } from "@/lib/render-certificate-pdf";
import { getCachedUrl, cacheBuffer, pdfKey } from "@/lib/blob-cache";
import type { Category, Degree } from "@/lib/decrees";
import type { Locale } from "@/i18n/locales";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const cert = await getCertificateBySlug(slug);
  if (!cert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // PDF download is only offered once a certificate is paid — the pending
  // state has no printable document, only the blurred preview PNG.
  if (cert.status === "pending") {
    return NextResponse.json({ error: "Certificate not yet paid" }, { status: 402 });
  }

  const key = pdfKey(slug);
  const cached = await getCachedUrl(key);
  if (cached) {
    const upstream = await fetch(cached);
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="thing-am-${slug}.pdf"`,
      },
    });
  }

  const strings = buildCertificateStrings({
    locale: cert.locale as Locale,
    registryNo: cert.id,
    createdAt: cert.createdAt,
    category: cert.category as Category,
    degree: cert.degree as Degree,
  });

  const pdf = await renderCertificatePdf({
    locale: cert.locale as Locale,
    fromName: cert.fromName,
    toName: cert.toName,
    decreeText: cert.decreeText,
    strings,
  });

  await cacheBuffer(key, pdf, "application/pdf");

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="thing-am-${slug}.pdf"`,
    },
  });
}
