import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  fromName: text("from_name").notNull(),
  toName: text("to_name").notNull(),
  category: text("category").notNull(), // domestic | workplace | traffic | betrayal | unspecified
  degree: text("degree").notNull(), // first | second | third
  decreeText: text("decree_text").notNull(),
  decreeKey: text("decree_key").notNull(),
  clause: text("clause").notNull(), // e.g. "7(b)"
  locale: text("locale").notNull().default("en"), // hy | en | ru
  status: text("status").notNull().default("pending"), // pending | paid | lifted
  paidAt: timestamp("paid_at", { withTimezone: true }),
  liftedBy: integer("lifted_by"),
  // Admin moderation (spec §13): set when a named person's takedown request,
  // or another moderation action, removes a certificate from view. Kept
  // distinct from `status` so payment history/analytics aren't disturbed by
  // a later unpublish.
  unpublishedAt: timestamp("unpublished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id")
    .notNull()
    .references(() => certificates.id),
  provider: text("provider").notNull(), // vpos
  providerRef: text("provider_ref").notNull(),
  amount: integer("amount").notNull(), // minor units (luma / dram integer, AMD has no minor unit so this is whole AMD)
  currency: text("currency").notNull(), // AMD
  status: text("status").notNull(), // pending | succeeded | failed
  rawPayload: jsonb("raw_payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Rate limiting (spec §13: 10 filings/hour per IP). Backed by the DB rather
// than in-memory state so it works correctly across Vercel's stateless
// serverless invocations. Rows are short-lived — a cheap cleanup query (or
// a cron) can prune anything older than the window.
export const rateLimitHits = pgTable("rate_limit_hits", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type RateLimitHit = typeof rateLimitHits.$inferSelect;
