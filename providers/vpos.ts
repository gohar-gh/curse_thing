import type { PaymentProvider } from "./types";

/**
 * Armenian V-POS provider — Ameriabank vPOS 3.1 REST API.
 *
 * Built directly against the vendor's API doc ("AmeriaBank vPOS 3.1 — API
 * Protocol Description", vPOS_Eng_3.1.docx). Two things from that doc are
 * still unconfirmed and flagged below:
 *   - TODO(vpos-credentials): real ClientID/Username/Password from the
 *     bank. VPOS_BASE_URL defaults to the documented *test* host — the
 *     doc never states the production host, confirm it with Ameriabank.
 *   - TODO(vpos-stage): whether this merchant's terminal is configured
 *     single-stage (funds captured immediately, OrderStatus 2) or
 *     two-stage (funds held, OrderStatus 1, needs a ConfirmPayment to
 *     capture) is a terminal-level setting on the bank's side, not
 *     something the API request controls. `verifyCallback` below handles
 *     both cases defensively.
 *
 * Flow (this is a redirect+poll protocol, not a push webhook):
 *   1. createPayment calls InitPayment, gets a PaymentID, and returns the
 *      hosted-payment-page URL to redirect the browser to.
 *   2. The customer pays on Ameriabank's own page.
 *   3. Ameriabank redirects the browser back to BackURL (our
 *      /api/webhooks/vpos route) with orderID/paymentID/resposneCode
 *      ["resposneCode" is the vendor's own spelling, not a typo we
 *      introduced] as query params.
 *   4. verifyCallback does NOT trust those query params on their own —
 *      it calls GetPaymentDetails server-to-server with our credentials
 *      to get the authoritative OrderStatus. That authenticated call is
 *      this protocol's equivalent of signature verification (spec §7).
 */

const VPOS_BASE_URL = (process.env.VPOS_BASE_URL ?? "https://servicestest.ameriabank.am/VPOS").replace(
  /\/$/,
  ""
);
const CLIENT_ID = process.env.VPOS_CLIENT_ID ?? "";
const USERNAME = process.env.VPOS_USERNAME ?? "";
const PASSWORD = process.env.VPOS_PASSWORD ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// ISO 4217 numeric currency codes the API expects (§ InitPaymentRequest).
// This app only ever charges AMD, but the map is here because the API
// takes the numeric code, not the "AMD" string we use for display.
const CURRENCY_CODES: Record<string, string> = {
  AMD: "051",
  EUR: "978",
  USD: "840",
  RUB: "643",
};

type InitPaymentResponse = {
  PaymentID?: string;
  ResponseCode?: number; // successful = 1 (InitPayment uses this convention, not the "00" family below)
  ResponseMessage?: string;
};

type PaymentDetailsResponse = {
  ResponseCode?: string; // successful = "00" (Table 1)
  ResponseMessage?: string;
  OrderStatus?: number; // Table 2: 0 started,1 approved(held),2 deposited,3 void,4 refunded,5 autoauthorized,6 declined
  OrderID?: string;
  Amount?: number;
};

type ConfirmPaymentResponse = {
  ResponseCode?: string;
  ResponseMessage?: string;
};

async function vposFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${VPOS_BASE_URL}/api/VPOS/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<T>;
}

async function getPaymentDetails(paymentId: string): Promise<PaymentDetailsResponse> {
  return vposFetch<PaymentDetailsResponse>("GetPaymentDetails", {
    PaymentID: paymentId,
    Username: USERNAME,
    Password: PASSWORD,
  });
}

async function confirmPayment(paymentId: string, amount: number): Promise<ConfirmPaymentResponse> {
  return vposFetch<ConfirmPaymentResponse>("ConfirmPayment", {
    PaymentID: paymentId,
    Username: USERNAME,
    Password: PASSWORD,
    Amount: amount,
  });
}

export const vposProvider: PaymentProvider = {
  async createPayment(certId, amount, currency) {
    if (!CLIENT_ID || !USERNAME || !PASSWORD) {
      throw new Error(
        "VPOS_CLIENT_ID / VPOS_USERNAME / VPOS_PASSWORD are not configured — see .env.example TODO(vpos-credentials)."
      );
    }

    const currencyCode = CURRENCY_CODES[currency];
    if (!currencyCode) {
      throw new Error(`Unsupported V-POS currency: ${currency}`);
    }

    // Single BackURL — this protocol doesn't have separate success/fail
    // redirect targets; both land here and are told apart by resposneCode.
    const backUrl = `${BASE_URL}/api/webhooks/vpos`;

    const data = await vposFetch<InitPaymentResponse>("InitPayment", {
      ClientID: CLIENT_ID,
      Username: USERNAME,
      Password: PASSWORD,
      Currency: currencyCode,
      Description: `thing.am certificate ${certId}`,
      OrderID: Number(certId),
      Amount: amount,
      BackURL: backUrl,
    });

    if (data.ResponseCode !== 1 || !data.PaymentID) {
      throw new Error(
        `V-POS InitPayment failed: ${data.ResponseCode ?? "unknown"} ${data.ResponseMessage ?? ""}`.trim()
      );
    }

    return { redirectUrl: `${VPOS_BASE_URL}/Payments/Pay?id=${encodeURIComponent(data.PaymentID)}` };
  },

  async verifyCallback(payload) {
    const query = payload as { orderID?: string; paymentID?: string; resposneCode?: string };

    if (!query.orderID || !query.paymentID) {
      return { ok: false, providerRef: "", certId: "" };
    }

    // The redirect's own resposneCode is informational only — the actual
    // trust boundary is this authenticated server-to-server call.
    const details = await getPaymentDetails(query.paymentID);

    if (details.OrderStatus === 2) {
      // Single-stage: already fully captured.
      return { ok: true, providerRef: query.paymentID, certId: query.orderID };
    }

    if (details.OrderStatus === 1) {
      // Two-stage: funds are held, not yet captured — capture the full
      // amount now so "paid" always means "money actually collected".
      const confirmed = await confirmPayment(query.paymentID, details.Amount ?? 0);
      if (confirmed.ResponseCode === "00") {
        return { ok: true, providerRef: query.paymentID, certId: query.orderID };
      }
      console.error("V-POS ConfirmPayment failed", confirmed);
      return { ok: false, providerRef: query.paymentID, certId: query.orderID };
    }

    // OrderStatus 0/3/4/5/6 (started/void/refunded/autoauthorized/declined)
    // — not a completed payment.
    return { ok: false, providerRef: query.paymentID, certId: query.orderID };
  },
};
