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

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
