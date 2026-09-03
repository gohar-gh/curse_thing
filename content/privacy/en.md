# Privacy Policy

**Draft — for legal review.** This is a starting point for the operator's lawyer to review and finalize; it is not final copy and should not be relied on as legal advice.

## 1. What we store

When you file a certificate, we store:

- The two names you enter (filed-by, filed-against)
- The category, degree, and decree text of the certificate (including free-text wording, if you chose to write your own)
- The locale the certificate was created in
- Timestamps: when it was created, when (if) it was paid, when (if) it was unpublished following a takedown request

When you pay, we store a payment record: the provider (currently the Armenian V-POS acquirer), a provider reference, the amount and currency, a status, and the raw callback payload the payment provider sends us. **We never see or store your card number** — payment happens on the acquirer's own hosted page.

To enforce the filing rate limit (spec §13 — no more than 10 filings/hour from one source), we briefly record the IP address of each filing attempt. These records are not linked to the certificate content and are short-lived.

We do not create user accounts, and we do not collect email addresses anywhere in the filing flow.

## 2. Why we store it

- Certificate content and names: to generate and display the certificate at its public link.
- Payment records: to confirm payment, handle disputes, and meet basic accounting obligations.
- IP addresses (briefly): to prevent abuse of the filing form.

## 3. Who can see it

The certificate page is unlisted — reachable only via its unique link — but not access-controlled; anyone with the link can view it. The public ledger (`/registry`) shows the registry number, decree text, and degree for paid certificates, but **never** the names.

## 4. Retention and deletion

Certificate records are retained for 24 months from creation, after which they are deleted.

Any person named on a certificate may request its removal by emailing **[PLACEHOLDER: takedown contact email]**, without needing to prove their identity. We will unpublish the certificate; removal does not require deleting the underlying payment/accounting record before the normal retention period ends.

## 5. Who operates this service

**[PLACEHOLDER: operator legal entity name]**
**[PLACEHOLDER: operator registered address]**
Contact: **[PLACEHOLDER: operator contact email]**

*(These details must come from the operator before this document is used — do not publish with placeholders in place.)*
