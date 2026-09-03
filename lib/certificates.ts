import { eq, and, isNull, desc, count } from "drizzle-orm";
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

const LEDGER_PAGE_SIZE = 25;

/**
 * Public ledger (spec §10): registry number, decree, and degree only —
 * never names, and never pending/unpublished certificates. Paginated.
 */
export async function getLedgerPage(page: number): Promise<{
  entries: Pick<Certificate, "id" | "slug" | "decreeText" | "degree">[];
  totalPages: number;
}> {
  const offset = Math.max(0, page - 1) * LEDGER_PAGE_SIZE;

  const visible = and(eq(certificates.status, "paid"), isNull(certificates.unpublishedAt));

  const [{ value: total }] = await db.select({ value: count() }).from(certificates).where(visible);

  const entries = await db
    .select({
      id: certificates.id,
      slug: certificates.slug,
      decreeText: certificates.decreeText,
      degree: certificates.degree,
    })
    .from(certificates)
    .where(visible)
    .orderBy(desc(certificates.id))
    .limit(LEDGER_PAGE_SIZE)
    .offset(offset);

  return {
    entries,
    totalPages: Math.max(1, Math.ceil(total / LEDGER_PAGE_SIZE)),
  };
}

/**
 * Admin moderation action (spec §13): unpublish a certificate by slug.
 * Returns undefined if no certificate matches.
 */
export async function unpublishCertificateBySlug(slug: string): Promise<Certificate | undefined> {
  const [row] = await db
    .update(certificates)
    .set({ unpublishedAt: new Date() })
    .where(eq(certificates.slug, slug))
    .returning();
  return row;
}
