import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { isLocale, type Locale } from "@/i18n/locales";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: `thing.am — ${t("terms.pageTitle")}` };
}

function loadTermsMarkdown(locale: Locale): string {
  const path = join(process.cwd(), "content", "terms", `${locale}.md`);
  return readFileSync(path, "utf-8");
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);
  const t = await getTranslations();

  const html = await marked.parse(loadTermsMarkdown(locale));

  return (
    <section className="max-w-[760px] mx-auto px-7 py-12">
      <Link href="/" className="font-mono text-xs text-ink-soft hover:text-ink">
        &larr; {t("terms.backHome")}
      </Link>
      <article
        className="terms-content mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
