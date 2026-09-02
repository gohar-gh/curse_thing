import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findBlockedWord } from "../lib/blocklist";

type DecreeBank = Record<string, Record<string, { key: string; text: string }[]>>;

const CONTENT_DIR = join(__dirname, "..", "content", "decrees");

const CATEGORIES = ["domestic", "workplace", "traffic", "betrayal", "unspecified"];
const DEGREES = ["first", "second", "third"];
const MIN_PER_BUCKET = 12;

let failed = false;

for (const locale of ["en", "hy", "ru"] as const) {
  const path = join(CONTENT_DIR, `${locale}.json`);
  const bank: DecreeBank = JSON.parse(readFileSync(path, "utf-8"));

  for (const category of CATEGORIES) {
    if (!bank[category]) {
      console.error(`[${locale}] missing category: ${category}`);
      failed = true;
      continue;
    }
    for (const degree of DEGREES) {
      const entries = bank[category][degree];
      if (!entries) {
        console.error(`[${locale}] missing ${category}/${degree}`);
        failed = true;
        continue;
      }
      if (entries.length < MIN_PER_BUCKET) {
        console.error(
          `[${locale}] ${category}/${degree} has ${entries.length} entries, needs >= ${MIN_PER_BUCKET}`
        );
        failed = true;
      }
      for (const entry of entries) {
        const blockedWord = findBlockedWord(entry.text, locale);
        if (blockedWord) {
          console.error(
            `[${locale}] ${category}/${degree}/${entry.key} contains blocked word "${blockedWord}": "${entry.text}"`
          );
          failed = true;
        }
      }
    }
  }
}

if (failed) {
  console.error("\nDecree lint failed.");
  process.exit(1);
} else {
  console.log("Decree lint passed: all three locales clean.");
}
