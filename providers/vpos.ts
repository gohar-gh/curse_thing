import crypto from "node:crypto";
import type { PaymentProvider } from "./types";
import { slugFromId } from "@/lib/slug";

/**
 * Armenian V-POS (ArCa) provider.
 *
 * TODO(vpos-credentials): this is built against the general shape of ArCa's
 * documented VPOS2 REST protocol (register → hosted redirect → server
 * callback, HMAC-signed), but the spec explicitly calls out that the exact
 * callback signature scheme varies by bank and must be confirmed with the
 * acquirer before going live. Do not treat this as verified against real
 * ArCa documentation — swap in real test credentials and re-check the
 * signature verification logic in `verifyCallback` against ArCa's actual
 * integration guide first.
 */

const VPOS_BASE_URL = process.env.VPOS_BASE_URL ?? "https://servicestest.arca.am:8445/vpos2/rest";
const MERCHANT_ID = process.env.VPOS_MERCHANT_ID ?? "";
const MERCHANT_SECRET = process.env.VPOS_MERCHANT_SECRET ?? "";
const CALLBACK_SECRET = process.env.VPOS_CALLBACK_SECRET ?? MERCHANT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

type VposRegisterResponse = {
  orderId?: string;
  formUrl?: string;
  errorCode?: string;
  errorMessage?: string;
};

type VposCallbackPayload = {
  orderId?: string;
  orderNumber?: string;
  status?: string; // "1" / "success" style flag, exact contract TBD
  amount?: string | number;
  signature?: string;
};

export const vposProvider: PaymentProvider = {
  async createPayment(certId, amount, currency) {
    if (!MERCHANT_ID || !MERCHANT_SECRET) {
      throw new Error(
        "VPOS_MERCHANT_ID / VPOS_MERCHANT_SECRET are not configured — see .env.example TODO(vpos-credentials)."
      );
    }

    // These are browser redirect targets, not the server-to-server callback
    // — that's a separate notification to /api/webhooks/vpos configured on
    // the acquirer's side (exact mechanism TBD, see TODO(vpos-credentials)
    // above). /c/[slug] is a locale-less redirector to the certificate's
    // stored locale, since this interface (spec §7) carries no locale param.
    const slug = slugFromId(Number(certId));
    const returnUrl = `${BASE_URL}/c/${slug}`;
    const failUrl = `${BASE_URL}/c/${slug}?payment=failed`;

    const params = new URLSearchParams({
      userName: MERCHANT_ID,
      password: MERCHANT_SECRET,
      orderNumber: certId,
      amount: String(amount), // AMD has no minor unit; confirm whether ArCa expects luma (x100) once docs are in hand
      currency,
      returnUrl,
      failUrl,
    });

    const response = await fetch(`${VPOS_BASE_URL}/register.do`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = (await response.json()) as VposRegisterResponse;

    if (!data.formUrl || data.errorCode) {
      throw new Error(
        `V-POS registration failed: ${data.errorCode ?? "unknown"} ${data.errorMessage ?? ""}`.trim()
      );
    }

    return { redirectUrl: data.formUrl };
  },

  async verifyCallback(payload) {
    const body = payload as VposCallbackPayload;

    if (!body.orderNumber || !body.signature) {
      return { ok: false, providerRef: "", certId: "" };
    }

    // TODO(vpos-credentials): confirm the exact field concatenation order
    // and hash algorithm ArCa uses for callback signing — this HMAC-SHA256
    // scheme is a placeholder shape, not verified against bank docs.
    const expectedSignature = crypto
      .createHmac("sha256", CALLBACK_SECRET)
      .update(`${body.orderId ?? ""}:${body.orderNumber}:${body.amount ?? ""}:${body.status ?? ""}`)
      .digest("hex");

    const ok =
      body.signature === expectedSignature &&
      (body.status === "1" || body.status === "success" || body.status === "deposited");

    return {
      ok,
      providerRef: body.orderId ?? "",
      certId: body.orderNumber,
    };
  },
};
