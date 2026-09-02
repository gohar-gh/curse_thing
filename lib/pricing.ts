// Single fixed AMD pricing tier — this build charges only via the Armenian
// V-POS acquirer, so there is no geo-detection or currency branch (spec §6
// is narrowed: no Stripe/USD path in this build).
export const PRICE_AMD = 200;
export const CURRENCY = "AMD";

export function formatPriceAMD(amount: number): string {
  return `${amount} ֏`;
}
