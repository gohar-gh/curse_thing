"use server";

import { unpublishCertificateBySlug } from "@/lib/certificates";

export type UnpublishFormState = {
  message?: string;
  ok?: boolean;
};

/**
 * Gated by a shared-secret token (ADMIN_SECRET) rather than a full accounts
 * system — the product deliberately has no user accounts (spec's Notes),
 * but spec §13 still requires *some* access control on this specific
 * moderation action so it can't be triggered by anyone who finds the URL.
 */
export async function unpublishCertificate(
  _prevState: UnpublishFormState,
  formData: FormData
): Promise<UnpublishFormState> {
  const token = String(formData.get("token") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return { ok: false, message: "ADMIN_SECRET is not configured on the server." };
  }
  if (token !== adminSecret) {
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
