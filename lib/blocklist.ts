import type { Locale } from "@/i18n/locales";

// Whole-word blocklists (never substring matches — see tokenize below,
// which avoids the Armenian/Russian root-collision false positives a naive
// regex would produce, e.g. "որդի" inside "նախորդից", "худ" inside
// "худший"). Shared between the build-time decree-bank lint
// (scripts/lint-decrees.ts) and runtime validation of user-submitted
// free-text curses (app/[locale]/actions.ts) — see spec §4: curses must
// never reference physical harm, illness, death, family members,
// appearance, or anything sexual.
export const blocklists: Record<Locale, Set<string>> = {
  en: new Set([
    "die", "dies", "died", "dying", "death", "deaths", "kill", "kills", "killed", "killing",
    "sick", "ill", "illness", "disease", "cancer",
    "mother", "father", "sister", "brother", "son", "daughter", "parent", "parents", "child", "children", "family",
    "ugly", "fat", "skinny", "wrinkle", "wrinkles", "wrinkled",
    "sex", "sexual", "naked", "nude",
    "pain", "injury", "injured", "hurt", "wound", "wounded",
  ]),
  hy: new Set([
    "մահ", "մահանալ", "մեռնել", "մեռավ", "սպանել", "սպանվել",
    "հիվանդ", "հիվանդություն", "ախտ", "քաղցկեղ",
    "մայր", "հայր", "քույր", "եղբայր", "որդի", "դուստր", "ընտանիք", "երեխա", "երեխաներ",
    "տգեղ", "գեր", "նիհար",
    "սեքս", "մերկ",
    "ցավ", "վնաս", "վիրավոր", "վիրավորված",
  ]),
  ru: new Set([
    "смерть", "смерти", "умер", "умерла", "умереть", "убийство", "убить", "убил",
    "болезнь", "болен", "больна", "рак",
    "мать", "отец", "сестра", "брат", "сын", "дочь", "семья", "ребёнок", "дети",
    "уродливый", "уродливая", "толстый", "толстая", "худой", "худая", "худые",
    "секс", "голый", "обнажён", "обнажена",
  ]),
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
}

/**
 * Returns the first blocked word found in `text` for the given locale, or
 * null if it's clean.
 */
export function findBlockedWord(text: string, locale: Locale): string | null {
  const blocked = blocklists[locale];
  for (const word of tokenize(text)) {
    if (blocked.has(word)) return word;
  }
  return null;
}
