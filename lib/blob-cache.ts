import { put, head } from "@vercel/blob";

/**
 * Cache a rendered certificate asset (PNG/PDF) in Vercel Blob keyed by slug,
 * generated once at payment-confirmation time rather than on every request.
 * The pending-state PNG uses a distinct key from the paid one, since the
 * blurred/overprinted version must never be silently swapped for the real
 * one once payment succeeds — the webhook regenerates and re-caches under
 * the paid key.
 */
export function pngKey(slug: string, pending: boolean): string {
  return pending ? `certificates/${slug}/pending.png` : `certificates/${slug}/paid.png`;
}

export function pdfKey(slug: string): string {
  return `certificates/${slug}/certificate.pdf`;
}

export async function getCachedUrl(key: string): Promise<string | null> {
  try {
    const info = await head(key);
    return info.url;
  } catch {
    return null;
  }
}

/**
 * Best-effort: returns null (instead of throwing) when Blob storage isn't
 * configured, e.g. BLOB_READ_WRITE_TOKEN unset in local dev. Callers should
 * fall back to serving the buffer directly without caching in that case.
 */
export async function cacheBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  try {
    const blob = await put(key, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  } catch (err) {
    console.warn(`Blob cache write skipped for ${key}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
