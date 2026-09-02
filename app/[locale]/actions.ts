"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createDraftCertificate } from "@/lib/certificates";
import {
  pickDecree,
  getClause,
  parseRecentCookie,
  pushRecentCookie,
  recentCookieName,
  CATEGORIES,
  DEGREES,
  type Category,
  type Degree,
} from "@/lib/decrees";
import { findBlockedWord } from "@/lib/blocklist";
import type { Locale } from "@/i18n/locales";

const MAX_CUSTOM_LENGTH = 280;

const filingSchema = z.object({
  fromName: z.string().trim().min(1).max(40),
  toName: z.string().trim().min(1).max(40),
  category: z.enum(CATEGORIES as [Category, ...Category[]]),
  locale: z.enum(["hy", "en", "ru"] as const),
  mode: z.enum(["template", "custom"]),
  customText: z.string().optional(),
});

export type FilingFormState = {
  error?: string;
};

// Strip anything that isn't plausibly a short name — no URLs, no newlines,
// consistent with the 40-char cap and abuse-control intent from spec §13
// (full abuse-control suite is deferred, but names shouldn't carry raw
// markup/links from day one).
function sanitizeName(input: string): string {
  return input.replace(/https?:\/\/\S+/gi, "").replace(/[\r\n]+/g, " ").trim().slice(0, 40);
}

function sanitizeCustomText(input: string): string {
  return input
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, MAX_CUSTOM_LENGTH);
}

function randomDegree(): Degree {
  return DEGREES[Math.floor(Math.random() * DEGREES.length)];
}

export async function fileGrievance(
  _prevState: FilingFormState,
  formData: FormData
): Promise<FilingFormState> {
  const parsed = filingSchema.safeParse({
    fromName: sanitizeName(String(formData.get("fromName") ?? "")),
    toName: sanitizeName(String(formData.get("toName") ?? "")),
    category: formData.get("category"),
    locale: formData.get("locale"),
    mode: formData.get("mode"),
    customText: formData.get("customText") ? String(formData.get("customText")) : undefined,
  });

  if (!parsed.success) {
    return { error: "invalid" };
  }

  const { fromName, toName, category, locale, mode } = parsed.data;
  const degree = randomDegree();

  let decreeText: string;
  let decreeKey: string;

  if (mode === "custom") {
    const customText = sanitizeCustomText(parsed.data.customText ?? "");
    if (customText.length === 0) {
      return { error: "empty" };
    }
    // Free-text curses bypass the template bank, so they get the same
    // moderation pass the bank itself is linted against at build time
    // (spec §4) — this is the one runtime content check standing in for
    // the fuller abuse-control suite deferred to a later phase.
    const blockedWord = findBlockedWord(customText, locale as Locale);
    if (blockedWord) {
      return { error: "blocked" };
    }
    decreeText = customText;
    decreeKey = "custom";
  } else {
    const cookieStoreForPick = await cookies();
    const cookieNameForPick = recentCookieName(category);
    const recentKeysForPick = parseRecentCookie(cookieStoreForPick.get(cookieNameForPick)?.value);
    const decree = pickDecree(locale as Locale, category, degree, recentKeysForPick);
    decreeText = decree.text;
    decreeKey = decree.key;
  }

  const cert = await createDraftCertificate({
    fromName,
    toName,
    category,
    degree,
    decreeText,
    decreeKey,
    clause: getClause(category),
    locale: locale as Locale,
  });

  if (mode === "template") {
    const cookieStore = await cookies();
    const cookieName = recentCookieName(category);
    const recentKeys = parseRecentCookie(cookieStore.get(cookieName)?.value);
    cookieStore.set(cookieName, JSON.stringify(pushRecentCookie(recentKeys, decreeKey)), {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  redirect(`/${locale}/c/${cert.slug}`);
}
