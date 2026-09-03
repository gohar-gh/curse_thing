import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getLedgerPage } from "@/lib/certificates";
import { slugFromId } from "@/lib/slug";
import type { Degree } from "@/lib/decrees";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: `thing.am — ${t("ledger.pageTitle")}` };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function RegistryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const page = Math.max(1, Number(pageParam) || 1);
  const { entries, totalPages } = await getLedgerPage(page);

  return (
    <section className="max-w-[1020px] mx-auto px-7 py-12">
      <h1 className="font-normal text-[26px] m-0 mb-1 text-ink">{t("ledger.heading")}</h1>
      <p className="text-ink-soft text-[17px] m-0 mb-6">{t("ledger.sub")}</p>

      {entries.length === 0 ? (
        <p className="text-ink-soft font-mono text-sm">{t("ledger.empty")}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr>
                  <th className="w-[88px] font-mono text-[9.5px] tracking-[0.12em] text-ink-soft text-left font-normal pb-2.5 pr-2.5 border-b border-rule">
                    {t("ledger.colNo")}
                  </th>
                  <th className="font-mono text-[9.5px] tracking-[0.12em] text-ink-soft text-left font-normal pb-2.5 pr-2.5 border-b border-rule">
                    {t("ledger.colDecree")}
                  </th>
                  <th className="w-[118px] font-mono text-[9.5px] tracking-[0.12em] text-ink-soft text-left font-normal pb-2.5 border-b border-rule">
                    {t("ledger.colDegree")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[rgba(47,79,62,0.045)]">
                    <td className="py-[11px] pr-2.5 border-b border-[rgba(22,33,27,0.1)] align-top font-mono text-sm text-seal whitespace-nowrap">
                      {slugFromId(entry.id)}
                    </td>
                    <td className="py-[11px] pr-2.5 border-b border-[rgba(22,33,27,0.1)] align-top">
                      {entry.decreeText}
                    </td>
                    <td className="py-[11px] border-b border-[rgba(22,33,27,0.1)] align-top font-mono text-[11.5px] text-ink-soft whitespace-nowrap">
                      {t(`degrees.${(entry.degree as Degree).toUpperCase() as "FIRST" | "SECOND" | "THIRD"}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 font-mono text-xs">
            <Link
              href={`/registry?page=${page - 1}`}
              aria-disabled={page <= 1}
              className={`px-3 py-1.5 border border-rule ${
                page <= 1 ? "pointer-events-none opacity-30" : "text-ink-soft hover:border-green"
              }`}
            >
              {t("ledger.prev")}
            </Link>
            <span className="text-ink-soft">{t("ledger.pageOf", { current: page, total: totalPages })}</span>
            <Link
              href={`/registry?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              className={`px-3 py-1.5 border border-rule ${
                page >= totalPages ? "pointer-events-none opacity-30" : "text-ink-soft hover:border-green"
              }`}
            >
              {t("ledger.next")}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
