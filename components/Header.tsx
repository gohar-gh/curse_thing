"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { locales } from "@/i18n/locales";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  hy: "ՀԱՅ",
  ru: "РУС",
};

function WordmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={30}
      height={30}
      fill="none"
      stroke="#2F4F3E"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M10 11V5a1.5 1.5 0 0 1 3 0v6" />
      <path d="M13 11V6a1.5 1.5 0 0 1 3 0v6" />
      <path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-1a1.5 1.5 0 0 1 3 0" />
    </svg>
  );
}

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <header className="max-w-[1020px] mx-auto w-full px-7">
      <div className="flex justify-between items-baseline gap-5 py-[22px_0_16px] border-b-[3px] border-double border-rule flex-wrap pt-[22px] pb-4">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <WordmarkIcon />
          <b className="font-semibold text-[23px] tracking-[0.01em] text-ink">{t("masthead.wordmark")}</b>
        </Link>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="font-mono text-[11.5px] text-ink-soft text-right leading-[1.6]">
            {t("masthead.tagline")}
            <br />
            {t("masthead.office")}
          </div>

          <nav aria-label={t("languageSwitcher.label")} className="flex gap-2 font-mono text-xs">
            {locales.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                aria-current={loc === locale ? "true" : undefined}
                className={`px-2 py-1 border ${
                  loc === locale
                    ? "bg-green text-[#EDF1E7] border-green"
                    : "border-rule text-ink-soft hover:border-green"
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal focus-visible:outline-offset-2`}
              >
                {LOCALE_LABELS[loc]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
