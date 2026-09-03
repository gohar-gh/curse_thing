"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { fileGrievance, type FilingFormState } from "@/app/[locale]/actions";
import { CATEGORIES, type Category } from "@/lib/decrees";
import { PRICE_AMD, formatPriceAMD } from "@/lib/pricing";

const MAX_CUSTOM_LENGTH = 280;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-mono text-[13px] tracking-[0.06em] bg-green text-[#EDF1E7] border-0 px-[30px] py-4 cursor-pointer hover:bg-[#25402F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal focus-visible:outline-offset-[3px] disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? "…" : label}
    </button>
  );
}

const initialState: FilingFormState = {};

export function FilingForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [category, setCategory] = useState<Category>("domestic");
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [customText, setCustomText] = useState("");
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [state, formAction] = useActionState(fileGrievance, initialState);

  const ERROR_KEYS: Record<string, string> = {
    empty: "filing.errorEmpty",
    blocked: "filing.errorBlocked",
    rate_limited: "filing.errorRateLimited",
    name_sentence: "filing.errorNameSentence",
    name_blocked_word: "filing.errorNameBlocked",
    name_public_figure: "filing.errorNamePublicFigure",
  };
  const errorMessage = state.error
    ? t(ERROR_KEYS[state.error] ?? "filing.errorInvalid")
    : null;

  return (
    <section className="max-w-[1020px] mx-auto px-7 border-t-[3px] border-double border-rule pt-[52px] pb-5" id="file">
      <h3 className="font-normal text-[31px] m-0 mb-1.5 text-ink">{t("filing.heading")}</h3>
      <p className="text-ink-soft m-0 mb-8 max-w-[52ch]">{t("filing.lede")}</p>

      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="mode" value={mode} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[720px]">
          <div>
            <label htmlFor="fromName" className="block font-mono text-[10.5px] tracking-[0.1em] text-ink-soft mb-[7px]">
              {t("filing.filedBy")}
            </label>
            <input
              type="text"
              id="fromName"
              name="fromName"
              required
              maxLength={40}
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder={t("filing.namePlaceholderFrom")}
              className="w-full px-[13px] py-[11px] font-serif text-lg text-ink bg-cert-surface border border-rule rounded-none focus:outline focus:outline-2 focus:outline-green focus:outline-offset-1"
            />
          </div>
          <div>
            <label htmlFor="toName" className="block font-mono text-[10.5px] tracking-[0.1em] text-ink-soft mb-[7px]">
              {t("filing.filedAgainst")}
            </label>
            <input
              type="text"
              id="toName"
              name="toName"
              required
              maxLength={40}
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder={t("filing.namePlaceholderTo")}
              className="w-full px-[13px] py-[11px] font-serif text-lg text-ink bg-cert-surface border border-rule rounded-none focus:outline focus:outline-2 focus:outline-green focus:outline-offset-1"
            />
          </div>
        </div>

        <div>
          <span className="block font-mono text-[10.5px] tracking-[0.1em] text-ink-soft mt-[30px] mb-[7px]">
            {t("filing.natureOfGrievance")}
          </span>
          <div className="flex flex-wrap gap-[9px] mb-2" role="group" aria-label={t("filing.natureOfGrievance")}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={cat === category}
                onClick={() => setCategory(cat)}
                className={`font-mono text-xs px-[14px] py-2 cursor-pointer border focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal focus-visible:outline-offset-2 ${
                  cat === category
                    ? "bg-green border-green text-[#EDF1E7]"
                    : "bg-transparent border-rule text-ink-soft"
                }`}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block font-mono text-[10.5px] tracking-[0.1em] text-ink-soft mt-[30px] mb-[7px]">
            {t("filing.modeLabel")}
          </span>
          <div className="flex flex-wrap gap-[9px] mb-2" role="group" aria-label={t("filing.modeLabel")}>
            {(["template", "custom"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={m === mode}
                onClick={() => setMode(m)}
                className={`font-mono text-xs px-[14px] py-2 cursor-pointer border focus-visible:outline focus-visible:outline-2 focus-visible:outline-seal focus-visible:outline-offset-2 ${
                  m === mode
                    ? "bg-green border-green text-[#EDF1E7]"
                    : "bg-transparent border-rule text-ink-soft"
                }`}
              >
                {t(m === "template" ? "filing.modeTemplate" : "filing.modeCustom")}
              </button>
            ))}
          </div>

          {mode === "custom" && (
            <div className="max-w-[720px] mt-3">
              <label htmlFor="customText" className="block font-mono text-[10.5px] tracking-[0.1em] text-ink-soft mb-[7px]">
                {t("filing.customTextLabel")}
              </label>
              <textarea
                id="customText"
                name="customText"
                required
                maxLength={MAX_CUSTOM_LENGTH}
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t("filing.customTextPlaceholder")}
                className="w-full px-[13px] py-[11px] font-serif italic text-lg text-ink bg-cert-surface border border-rule rounded-none focus:outline focus:outline-2 focus:outline-green focus:outline-offset-1 resize-none"
              />
              <div className="flex justify-between mt-1.5">
                <p className="text-ink-soft text-xs m-0">{t("filing.customTextHint")}</p>
                <span className="font-mono text-[10px] text-ink-soft shrink-0 ml-3">
                  {customText.length}/{MAX_CUSTOM_LENGTH}
                </span>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <p role="alert" className="text-seal font-mono text-xs mt-2">
            {errorMessage}
          </p>
        )}

        <div className="flex items-center gap-[26px] flex-wrap pt-[34px] pb-[10px]">
          <SubmitButton label={t("filing.submit", { price: formatPriceAMD(PRICE_AMD) })} />
          <div className="text-ink-soft text-[17px]">
            {t("filing.priceNote")} <b className="text-ink font-medium">{t("filing.noAccount")}</b>
          </div>
        </div>
      </form>
    </section>
  );
}
