import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocPage } from "@/components/LegalDocPage";
import { isLocale } from "@/i18n/locales";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: `thing.am — ${t("privacy.pageTitle")}` };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  setRequestLocale(locale);

  return <LegalDocPage contentDir="privacy" backHomeKey="privacy.backHome" locale={locale} />;
}
