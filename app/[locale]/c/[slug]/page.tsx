import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCertificateBySlug } from "@/lib/certificates";
import { buildCertificateStrings } from "@/lib/certificate-strings";
import { Certificate } from "@/components/Certificate";
import type { Category, Degree } from "@/lib/decrees";
import type { Locale } from "@/i18n/locales";
import { formatPriceAMD, PRICE_AMD } from "@/lib/pricing";
import { MODERATION_EMAIL } from "@/lib/moderation-contact";
import { startPayment } from "./actions";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ payment?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const cert = await getCertificateBySlug(slug);
  if (!cert) return {};

  const imageUrl = `${base}/api/og/${slug}`;
  return {
    title: `thing.am — No. ${slug}`,
    openGraph: {
      images: [{ url: imageUrl, width: 1200, height: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}

export default async function CertificatePage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { payment } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const cert = await getCertificateBySlug(slug);
  if (!cert) {
    notFound();
  }

  if (cert.unpublishedAt) {
    return (
      <section className="max-w-[1020px] mx-auto px-7 py-20 flex flex-col items-center text-center gap-2">
        <h1 className="font-normal text-2xl m-0 text-ink">{t("removed.heading")}</h1>
        <p className="text-ink-soft m-0 max-w-[52ch]">{t("removed.body")}</p>
      </section>
    );
  }

  const pending = cert.status === "pending";

  const strings = buildCertificateStrings({
    locale: cert.locale as Locale,
    registryNo: cert.id,
    createdAt: cert.createdAt,
    category: cert.category as Category,
    degree: cert.degree as Degree,
  });

  const startPaymentWithSlug = startPayment.bind(null, slug);

  return (
    <section className="max-w-[1020px] mx-auto px-7 py-10 flex flex-col items-center gap-8">
      {pending ? (
        <>
          {/* Server-rendered blurred PNG with a baked-in PENDING PAYMENT
              overprint — never a client-side CSS blur over live data. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/og/${slug}`}
            alt=""
            width={480}
            height={480}
            className="w-full max-w-[480px] h-auto"
          />

          <div className="text-center max-w-[52ch]">
            <h1 className="font-normal text-2xl m-0 mb-2 text-ink">{t("preview.heading")}</h1>
            <p className="text-ink-soft m-0">{t("preview.lede")}</p>
          </div>

          {payment === "failed" && (
            <p className="text-seal font-mono text-sm" role="alert">
              {t("preview.paymentFailed")}
            </p>
          )}

          <form action={startPaymentWithSlug}>
            <button
              type="submit"
              className="font-mono text-[13px] tracking-[0.06em] bg-green text-[#EDF1E7] border-0 px-[30px] py-4 cursor-pointer hover:bg-[#25402F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal focus-visible:outline-offset-[3px]"
            >
              {t("preview.payButton", { price: formatPriceAMD(PRICE_AMD) })}
            </button>
          </form>

          <a
            href={`mailto:${MODERATION_EMAIL}?subject=${encodeURIComponent(
              t("certPage.reportSubject", { slug })
            )}`}
            className="font-mono text-[11px] text-ink-soft hover:text-seal underline underline-offset-2"
          >
            {t("certPage.reportLink")}
          </a>
        </>
      ) : (
        <>
          <Certificate
            locale={cert.locale as Locale}
            fromName={cert.fromName}
            toName={cert.toName}
            decreeText={cert.decreeText}
            strings={strings}
          />

          <div className="flex flex-wrap gap-4 justify-center font-mono text-[13px]">
            <a
              href={`/${locale}/c/${slug}`}
              className="px-4 py-2 border border-rule text-ink-soft hover:border-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
            >
              {t("certPage.publicLink")}
            </a>
            <a
              href={`/api/og/${slug}`}
              download
              className="px-4 py-2 border border-rule text-ink-soft hover:border-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
            >
              {t("certPage.downloadPng")}
            </a>
            <a
              href={`/api/pdf/${slug}`}
              download
              className="px-4 py-2 border border-rule text-ink-soft hover:border-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal"
            >
              {t("certPage.downloadPdf")}
            </a>
          </div>

          <a
            href={`mailto:${MODERATION_EMAIL}?subject=${encodeURIComponent(
              t("certPage.reportSubject", { slug })
            )}`}
            className="font-mono text-[11px] text-ink-soft hover:text-seal underline underline-offset-2"
          >
            {t("certPage.reportLink")}
          </a>
        </>
      )}
    </section>
  );
}
