export interface PaymentProvider {
  createPayment(
    certId: string,
    amount: number,
    currency: string
  ): Promise<{ redirectUrl: string }>;

  verifyCallback(
    payload: unknown
  ): Promise<{ ok: boolean; providerRef: string; certId: string }>;
}
