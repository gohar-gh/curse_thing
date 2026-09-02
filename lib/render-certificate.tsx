import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { Certificate, PendingOverprint, type CertificateProps } from "@/components/Certificate";
import { loadOgFonts } from "./og-fonts";
import { tokens } from "./certificate-tokens";

const CANVAS_SIZE = 1200;

function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        background: tokens.paper,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

async function toPng(node: React.ReactElement): Promise<Buffer> {
  const svg = await satori(node, {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    fonts: loadOgFonts(),
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: CANVAS_SIZE } });
  return Buffer.from(resvg.render().asPng());
}

/**
 * Renders the certificate to a 1200x1200 PNG. When `pending` is true, the
 * underlying certificate is Gaussian-blurred and a crisp diagonal "PENDING
 * PAYMENT" stamp is composited on top — both baked into the returned image
 * server-side. This is the only place blur is ever applied; there is no
 * client-side CSS-filter path, since that would be trivially removable in
 * devtools (spec §9).
 */
export async function renderCertificatePng(
  props: CertificateProps,
  pending: boolean
): Promise<Buffer> {
  const basePng = await toPng(
    <Canvas>
      <Certificate {...props} />
    </Canvas>
  );

  if (!pending) {
    return basePng;
  }

  const blurred = await sharp(basePng).blur(9).toBuffer();

  const stampPng = await toPng(
    <PendingOverprint text={props.strings.pendingPayment} locale={props.locale} size={CANVAS_SIZE} />
  );

  return sharp(blurred)
    .composite([{ input: stampPng, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
