import leoProfanity from "leo-profanity";
import publicFigures from "@/content/moderation/public-figures.json";
import type { Locale } from "@/i18n/locales";

/**
 * Profanity/slur check for the FILED-BY and FILED-AGAINST name fields
 * (spec §13). Backed by leo-profanity's curated English list (253 terms,
 * Shutterstock-derived) for `en`.
 *
 * TODO(moderation): leo-profanity ships only an English dictionary — there
 * is no bundled, vetted Armenian or Russian slur list to load here. Hand-
 * authoring one is a real content-moderation task that deserves a native-
 * speaker moderator and a proper sourced list (or a commercial moderation
 * API), not a list I invent. Until that's in place, hy/ru names are only
 * covered by the sentence-shape heuristic below, not a word list — this is
 * a real gap, not an oversight.
 */
leoProfanity.loadDictionary("en");

/**
 * Heuristic for "this looks like a sentence, not a name" (spec §13): too
 * many words, or punctuation a real name wouldn't carry.
 */
function looksLikeSentence(name: string): boolean {
  const wordCount = name.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 6) return true;
  if (/[!?]/.test(name)) return true;
  if ((name.match(/[.,]/g) ?? []).length > 2) return true;
  return false;
}

const PUBLIC_FIGURES = publicFigures as unknown as Record<Locale, string[]>;

function matchesPublicFigure(name: string, locale: Locale): boolean {
  const list = PUBLIC_FIGURES[locale] ?? [];
  const normalized = name.trim().toLowerCase();
  return list.some((entry) => entry.toLowerCase() === normalized);
}

export type NameModerationResult =
  | { ok: true }
  | { ok: false; reason: "sentence" | "blocked_word" | "public_figure" };

export function moderateName(name: string, locale: Locale): NameModerationResult {
  if (looksLikeSentence(name)) {
    return { ok: false, reason: "sentence" };
  }

  if (locale === "en" && leoProfanity.check(name)) {
    return { ok: false, reason: "blocked_word" };
  }

  if (matchesPublicFigure(name, locale)) {
    return { ok: false, reason: "public_figure" };
  }

  return { ok: true };
}
