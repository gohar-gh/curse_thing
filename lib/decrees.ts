import enBank from "@/content/decrees/en.json";
import hyBank from "@/content/decrees/hy.json";
import ruBank from "@/content/decrees/ru.json";
import type { Locale } from "@/i18n/locales";

export type Category = "domestic" | "workplace" | "traffic" | "betrayal" | "unspecified";
export type Degree = "first" | "second" | "third";

export type DecreeEntry = { key: string; text: string };
type DecreeBank = Record<Category, Record<Degree, DecreeEntry[]>>;

const banks: Record<Locale, DecreeBank> = {
  en: enBank as DecreeBank,
  hy: hyBank as DecreeBank,
  ru: ruBank as DecreeBank,
};

export const CATEGORIES: Category[] = ["domestic", "workplace", "traffic", "betrayal", "unspecified"];
export const DEGREES: Degree[] = ["first", "second", "third"];

// Clause numbering is decorative bureaucratic flavor, keyed by category so
// it stays consistent across certificates in the same category.
const CLAUSE_BY_CATEGORY: Record<Category, string> = {
  domestic: "7(b)",
  workplace: "12(a)",
  traffic: "4(c)",
  betrayal: "9(d)",
  unspecified: "1(a)",
};

export function getClause(category: Category): string {
  return CLAUSE_BY_CATEGORY[category];
}

/**
 * Picks a random decree for the given locale/category/degree, excluding any
 * keys in `recentKeys` (the last-5-used cookie for that category) when a
 * non-excluded option exists.
 */
export function pickDecree(
  locale: Locale,
  category: Category,
  degree: Degree,
  recentKeys: string[]
): DecreeEntry {
  const pool = banks[locale][category][degree];
  const eligible = pool.filter((entry) => !recentKeys.includes(entry.key));
  const candidates = eligible.length > 0 ? eligible : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const RECENT_COOKIE_PREFIX = "thing_am_recent_";
const RECENT_LIMIT = 5;

export function recentCookieName(category: Category): string {
  return `${RECENT_COOKIE_PREFIX}${category}`;
}

export function parseRecentCookie(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentCookie(existing: string[], key: string): string[] {
  return [key, ...existing.filter((k) => k !== key)].slice(0, RECENT_LIMIT);
}
