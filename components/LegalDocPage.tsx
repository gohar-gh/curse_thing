import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/locales";

function loadMarkdown(dir: string, locale: Locale): string {
  const path = join(process.cwd(), "content", dir, `${locale}.md`);
  return readFileSync(path, "utf-8");
}

export async function LegalDocPage({
  contentDir,
  backHomeKey,
  locale,
}: {
  contentDir: "terms" | "privacy";
  backHomeKey: string;
  locale: Locale;
}) {
  const t = await getTranslations();
  const html = await marked.parse(loadMarkdown(contentDir, locale));

  return (
    <section className="max-w-[760px] mx-auto px-7 py-12">
      <Link href="/" className="font-mono text-xs text-ink-soft hover:text-ink">
        &larr; {t(backHomeKey)}
      </Link>
      <article className="terms-content mt-8" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
