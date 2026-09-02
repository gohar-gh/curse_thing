import { tokens, certFonts } from "@/lib/certificate-tokens";

export type CertificateLocale = "hy" | "en" | "ru";

export type CertificateStrings = {
  registryLine1: string;
  registryLine2: string;
  no: string; // e.g. "No. 04431" / "Հ. 04431" / "№ 04431", pre-formatted
  date: string; // pre-formatted display date
  title: string;
  subtitle: string;
  bodyBeKnown: string;
  bodyHasFiled: string;
  bodyGrievanceOf: string; // pre-interpolated with degree, e.g. "a grievance of the third degree, and it is decreed:"
  clauseLine1: string; // "CLAUSE 7(b)"
  clauseLine2: string; // category ordinance line, e.g. "ORD. OF DOMESTIC ANNOYANCE"
  expiresNever: string;
  registrarName: string;
  registrar: string;
  pendingPayment: string;
};

export type CertificateProps = {
  locale: CertificateLocale;
  fromName: string;
  toName: string;
  decreeText: string;
  strings: CertificateStrings;
};

// Bird/wing mark used both as the header wordmark and (mirrored in color)
// as the wax seal emblem — same path as the reference prototype.
function SealMark({ color, size }: { color: string; size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.2}
    >
      <path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M10 11V5a1.5 1.5 0 0 1 3 0v6" />
      <path d="M13 11V6a1.5 1.5 0 0 1 3 0v6" />
      <path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-1a1.5 1.5 0 0 1 3 0" />
    </svg>
  );
}

export function Certificate({
  locale,
  fromName,
  toName,
  decreeText,
  strings,
}: CertificateProps) {
  const fonts = certFonts(locale);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: tokens.green,
        padding: 5,
        position: "relative",
        width: 640,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", background: tokens.certSurface, padding: 4 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: tokens.certSurface,
            border: `1px solid ${tokens.green}`,
            padding: "26px 26px 22px",
            position: "relative",
          }}
        >
          {/* inset hairline */}
          <div
            style={{
              position: "absolute",
              top: 9,
              left: 9,
              right: 9,
              bottom: 9,
              border: "1px solid rgba(47,79,62,.3)",
            }}
          />

          {/* head */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 14,
              borderBottom: `1px solid ${tokens.rule}`,
              paddingBottom: 10,
              marginBottom: 18,
              fontFamily: fonts.mono,
              fontSize: 10,
              color: tokens.inkSoft,
              letterSpacing: 1,
              lineHeight: 1.7,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>{strings.registryLine1}</span>
              <span>{strings.registryLine2}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", textAlign: "right", alignItems: "flex-end" }}>
              <span>{strings.no}</span>
              <span>{strings.date}</span>
            </div>
          </div>

          {/* title */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
            <span style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 29, color: tokens.ink }}>
              {strings.title}
            </span>
            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 9.5,
                letterSpacing: 3,
                color: tokens.gold,
                marginTop: 5,
              }}
            >
              {strings.subtitle}
            </span>
          </div>

          {/* body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              fontFamily: fonts.serif,
              fontSize: 17,
              lineHeight: 1.9,
              color: tokens.ink,
              marginBottom: 18,
            }}
          >
            <span>
              {strings.bodyBeKnown}{" "}
              <span style={{ fontStyle: "italic", borderBottom: `1px solid ${tokens.inkSoft}`, padding: "0 14px" }}>
                {fromName}
              </span>
            </span>
            <span>
              {strings.bodyHasFiled}{" "}
              <span style={{ fontStyle: "italic", borderBottom: `1px solid ${tokens.inkSoft}`, padding: "0 14px" }}>
                {toName}
              </span>
            </span>
            <span>{strings.bodyGrievanceOf}</span>
          </div>

          {/* decree */}
          <div
            style={{
              display: "flex",
              borderTop: `1px solid ${tokens.rule}`,
              borderBottom: `1px solid ${tokens.rule}`,
              padding: "16px 14px",
              marginBottom: 18,
              textAlign: "center",
              justifyContent: "center",
              fontFamily: fonts.serif,
              fontSize: 19,
              lineHeight: 1.7,
              fontStyle: "italic",
              color: tokens.ink,
            }}
          >
            <span>{decreeText}</span>
          </div>

          {/* foot */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: fonts.mono,
                fontSize: 9,
                lineHeight: 1.8,
                color: tokens.inkSoft,
                letterSpacing: 0.5,
              }}
            >
              <span>{strings.clauseLine1}</span>
              <span>{strings.clauseLine2}</span>
              <span>{strings.expiresNever}</span>
            </div>

            <div
              style={{
                display: "flex",
                width: 74,
                height: 74,
                borderRadius: 37,
                background: tokens.seal,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SealMark color={tokens.sealText} size={34} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span
                style={{
                  fontFamily: fonts.serif,
                  fontStyle: "italic",
                  fontSize: 22,
                  color: tokens.ink,
                  borderBottom: `1px solid ${tokens.inkSoft}`,
                  paddingBottom: 2,
                  minWidth: 132,
                  textAlign: "right",
                }}
              >
                {strings.registrarName}
              </span>
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 8.5,
                  letterSpacing: 1.5,
                  color: tokens.inkSoft,
                  marginTop: 5,
                }}
              >
                {strings.registrar}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The diagonal "PENDING PAYMENT" overprint, rendered as its own transparent
 * pass and composited on top of a server-side-blurred certificate render.
 * See lib/render-certificate.tsx — never applied as a CSS filter over live
 * DOM data client-side (spec §9 non-negotiable).
 */
export function PendingOverprint({
  text,
  locale,
  size,
}: {
  text: string;
  locale: CertificateLocale;
  size: number;
}) {
  const fonts = certFonts(locale);
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          transform: "rotate(-18deg)",
          border: `3px solid ${tokens.seal}`,
          color: tokens.seal,
          fontFamily: fonts.mono,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 4,
          padding: "10px 22px",
          background: "rgba(231,235,226,0.55)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
