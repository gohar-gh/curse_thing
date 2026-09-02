import { NextRequest, NextResponse } from "next/server";
import { getCertificateBySlug } from "@/lib/certificates";
import { buildCertificateStrings } from "@/lib/certificate-strings";
import { renderCertificatePng } from "@/lib/render-certificate";
import { getCachedUrl, cacheBuffer, pngKey } from "@/lib/blob-cache";
import type { Category, Degree } from "@/lib/decrees";
import type { Locale } from "@/i18n/locales";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const cert = await getCertificateBySlug(slug);
  if (!cert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pending = cert.status === "pending";
  const key = pngKey(slug, pending);

  const cached = await getCachedUrl(key);
  if (cached) {
    const upstream = await fetch(cached);
    return new NextResponse(upstream.body, {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }

  const strings = buildCertificateStrings({
    locale: cert.locale as Locale,
    registryNo: cert.id,
    createdAt: cert.createdAt,
    category: cert.category as Category,
    degree: cert.degree as Degree,
  });

  const png = await renderCertificatePng(
    {
      locale: cert.locale as Locale,
      fromName: cert.fromName,
      toName: cert.toName,
      decreeText: cert.decreeText,
      strings,
    },
    pending
  );

  await cacheBuffer(key, png, "image/png");

  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
