import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { certificates, type Certificate } from "@/db/schema";
import { slugFromId } from "./slug";
import type { Category, Degree } from "./decrees";
import type { Locale } from "@/i18n/locales";

export async function createDraftCertificate(params: {
  fromName: string;
  toName: string;
  category: Category;
  degree: Degree;
  decreeText: string;
  decreeKey: string;
  clause: string;
  locale: Locale;
}): Promise<Certificate> {
  const [inserted] = await db
    .insert(certificates)
    .values({
      slug: "", // placeholder, backfilled below now that we have the id
      fromName: params.fromName,
      toName: params.toName,
      category: params.category,
      degree: params.degree,
      decreeText: params.decreeText,
      decreeKey: params.decreeKey,
      clause: params.clause,
      locale: params.locale,
      status: "pending",
    })
    .returning();

  const slug = slugFromId(inserted.id);
  const [updated] = await db
    .update(certificates)
    .set({ slug })
    .where(eq(certificates.id, inserted.id))
    .returning();

  return updated;
}

export async function getCertificateBySlug(slug: string): Promise<Certificate | undefined> {
  const [row] = await db.select().from(certificates).where(eq(certificates.slug, slug)).limit(1);
  return row;
}

export async function markCertificatePaid(id: number): Promise<Certificate> {
  const [row] = await db
    .update(certificates)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(certificates.id, id))
    .returning();
  return row;
}
