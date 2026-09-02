import { getTranslations, setRequestLocale } from "next-intl/server";
import { Certificate } from "@/components/Certificate";
import { FilingForm } from "@/components/FilingForm";
import { buildCertificateStrings } from "@/lib/certificate-strings";
import type { Locale } from "@/i18n/locales";
import enDecrees from "@/content/decrees/en.json";
import hyDecrees from "@/content/decrees/hy.json";
import ruDecrees from "@/content/decrees/ru.json";

const EXAMPLE_DECREES = { en: enDecrees, hy: hyDecrees, ru: ruDecrees } as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const exampleStrings = buildCertificateStrings({
    locale: locale as Locale,
    registryNo: 4431,
    createdAt: new Date("2026-09-02"),
    category: "domestic",
    degree: "third",
  });
  const exampleDecree = EXAMPLE_DECREES[locale as Locale].domestic.third.find(
    (d) => d.key === "headphones"
  )!;

  return (
    <>
      <section className="max-w-[1020px] mx-auto px-7 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[52px] items-center py-10 md:py-[58px]">
        <div>
          <h1 className="font-normal text-[38px] md:text-[60px] leading-[1.03] m-0 mb-[22px] tracking-[-0.015em] text-ink">
            {t("hero.titleLine1")}
            <br />
            {t.rich("hero.titleLine2", { em: (chunks) => <em className="italic">{chunks}</em> })}
          </h1>
          <p className="m-0 mb-[30px] max-w-[34ch] text-ink-soft text-xl">{t("hero.lede")}</p>
          <a
            href="#file"
            className="inline-block font-mono text-[13px] tracking-[0.06em] bg-green text-[#EDF1E7] px-[30px] py-4 no-underline hover:bg-[#25402F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal focus-visible:outline-offset-[3px]"
          >
            {t("hero.cta")}
          </a>
          <div className="font-mono text-[12.5px] text-ink-soft border-t border-rule pt-3 mt-[30px]">
            {t.rich("hero.counter", {
              b: (chunks) => <b className="text-seal font-medium">{chunks}</b>,
              filed: "4,431",
              lifted: "612",
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <Certificate
            locale={locale as Locale}
            fromName="Anna K."
            toName="Davit M."
            decreeText={exampleDecree.text}
            strings={exampleStrings}
          />
        </div>
      </section>

      <FilingForm />
    </>
  );
}
