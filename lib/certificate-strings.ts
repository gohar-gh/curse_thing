import enMessages from "@/messages/en.json";
import hyMessages from "@/messages/hy.json";
import ruMessages from "@/messages/ru.json";
import type { Locale } from "@/i18n/locales";
import type { CertificateStrings } from "@/components/Certificate";
import type { Category, Degree } from "./decrees";
import { getClause } from "./decrees";

const messagesByLocale: Record<Locale, typeof enMessages> = {
  en: enMessages,
  hy: hyMessages,
  ru: ruMessages,
};

function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export function buildCertificateStrings(params: {
  locale: Locale;
  registryNo: number;
  createdAt: Date;
  category: Category;
  degree: Degree;
}): CertificateStrings {
  const m = messagesByLocale[params.locale];
  const paddedNo = String(params.registryNo).padStart(5, "0");
  const degreeWord = m.degrees[params.degree];
  const clause = getClause(params.category);
  const ordinanceLabel = m.categories[params.category].toUpperCase();

  return {
    registryLine1: m.certificate.registryLine1,
    registryLine2: m.certificate.registryLine2,
    no: m.certificate.no.replace("{number}", paddedNo),
    date: formatDate(params.createdAt, params.locale),
    title: m.certificate.title,
    subtitle: m.certificate.subtitle,
    bodyBeKnown: m.certificate.bodyBeKnown,
    bodyHasFiled: m.certificate.bodyHasFiled,
    bodyGrievanceOf: m.certificate.bodyGrievanceOf.replace("{degree}", degreeWord),
    clauseLine1: `${m.certificate.clauseLabel} ${clause}`,
    clauseLine2: ordinanceLabel,
    expiresNever: m.certificate.expiresNever,
    registrarName: m.certificate.registrarName,
    registrar: m.certificate.registrar,
    pendingPayment: m.certificate.pendingPayment,
  };
}
