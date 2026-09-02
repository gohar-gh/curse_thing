"use server";

import { redirect } from "next/navigation";
import { getCertificateBySlug } from "@/lib/certificates";
import { vposProvider } from "@/providers/vpos";
import { PRICE_AMD, CURRENCY } from "@/lib/pricing";

export async function startPayment(slug: string) {
  const cert = await getCertificateBySlug(slug);
  if (!cert || cert.status !== "pending") {
    throw new Error("Certificate not found or already paid");
  }

  const { redirectUrl } = await vposProvider.createPayment(String(cert.id), PRICE_AMD, CURRENCY);
  redirect(redirectUrl);
}
