import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

/**
 * Placeholder payment-method badges. Spec §11 requires official brand
 * assets from each scheme's brand centre, used unmodified (no tracing or
 * recolouring) — these text badges are intentionally generic stand-ins
 * until real ArCa / Visa / Mastercard SVGs are dropped in to replace them.
 */
function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center h-7 px-3 border border-white/25 text-white/70 text-[11px] font-mono tracking-wide">
      {label}
    </span>
  );
}

export function Footer() {
  const t = useTranslations();

  return (
    <footer>
      <div className="max-w-[1020px] mx-auto px-7 pt-10">
        <div className="border border-rule bg-cert-surface px-6 py-5">
          <div className="font-mono text-[10px] tracking-[0.2em] text-gold mb-2">
            {t("disclaimer.noticeLabel")}
          </div>
          <p className="font-serif text-xl text-ink m-0 mb-2">{t("disclaimer.heading")}</p>
          <p className="text-ink-soft text-sm leading-relaxed m-0 max-w-[70ch]">
            {t("disclaimer.body")}
          </p>
        </div>
      </div>

      <div className="bg-ink mt-10">
        <div className="max-w-[1020px] mx-auto px-7 py-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] tracking-[0.15em] text-white/50 mr-1">
              {t("footer.paymentMethodsLabel")}
            </span>
            {/* TODO: replace with official brand-centre SVGs (ArCa, Visa, Mastercard) — do not trace/recolour, per spec §11 */}
            <PaymentBadge label="ArCa" />
            <PaymentBadge label="VISA" />
            <PaymentBadge label="Mastercard" />
          </div>

          <div className="flex justify-between items-center gap-4 flex-wrap font-mono text-[11px] text-white/60 border-t border-white/15 pt-4">
            <div>{t("footer.line1")}</div>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/registry" className="text-white/60 hover:text-white/90">
                {t("footer.registryLink")}
              </Link>
              <Link href="/terms" className="text-white/60 hover:text-white/90">
                {t("footer.termsLink")}
              </Link>
              <Link href="/privacy" className="text-white/60 hover:text-white/90">
                {t("footer.privacyLink")}
              </Link>
              <span>{t("footer.contact")}</span>
            </div>
          </div>

          <div className="font-mono text-[10px] text-white/40">{t("footer.entertainmentLine")}</div>
        </div>
      </div>
    </footer>
  );
}
