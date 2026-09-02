import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Certificate, type CertificateProps } from "@/components/Certificate";
import { tokens } from "./certificate-tokens";

/**
 * PDF generation renders the same <Certificate> component (spec §9: single
 * source of truth) to static HTML, then prints it with headless Chrome.
 * This is the one piece of the pipeline that needs a Vercel-compatible
 * headless Chrome binary (@sparticuz/chromium + puppeteer-core) rather than
 * a locally installed browser — see providers/vpos.ts-style TODO below for
 * the one thing to verify once deployed.
 */

let cachedFontFaceCss: string | null = null;

/**
 * Inlines app/fonts.css as base64 data URIs, preserving its per-file
 * unicode-range subsetting (latin/cyrillic/armenian/etc.) so Chromium picks
 * the right glyph subset per character exactly as the browser does — a
 * single guessed file per family would silently drop coverage for two of
 * the three locales.
 */
function buildFontFaceCss(): string {
  if (cachedFontFaceCss) return cachedFontFaceCss;

  const css = readFileSync(join(process.cwd(), "app", "fonts.css"), "utf-8");
  cachedFontFaceCss = css.replace(/url\(\/fonts\/([^)]+\.woff2)\)/g, (_match, filename: string) => {
    const buf = readFileSync(join(process.cwd(), "public", "fonts", filename));
    return `url(data:font/woff2;base64,${buf.toString("base64")})`;
  });

  return cachedFontFaceCss;
}

async function buildHtml(props: CertificateProps): Promise<string> {
  // Dynamically imported: a static top-level `import ... from
  // "react-dom/server"` trips Next's App Router bundler check ("You're
  // importing a component that imports react-dom/server"), even though
  // this is a plain Route Handler (not a Server Component) using it purely
  // as an HTML templating utility, unrelated to Next's own RSC rendering.
  const { renderToStaticMarkup } = await import("react-dom/server");
  const markup = renderToStaticMarkup(Certificate(props) as React.ReactElement);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${buildFontFaceCss()}
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: ${tokens.paper}; }
  body { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
</style>
</head>
<body>${markup}</body>
</html>`;
}

export async function renderCertificatePdf(props: CertificateProps): Promise<Buffer> {
  // Dynamically imported so this heavy dependency only loads on the PDF
  // code path, not on every cold start of the OG/PNG route.
  const puppeteer = await import("puppeteer-core");

  // @sparticuz/chromium bundles a Linux binary meant for Vercel's
  // serverless runtime — it can't run locally on macOS/Windows dev
  // machines (spawn ENOEXEC). PUPPETEER_EXECUTABLE_PATH lets local dev
  // point at a real installed browser instead; production leaves it unset
  // and gets the Vercel-compatible binary as before.
  const localExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  const { args, executablePath } = localExecutablePath
    ? { args: [] as string[], executablePath: localExecutablePath }
    : await (async () => {
        const chromium = (await import("@sparticuz/chromium")).default;
        return { args: chromium.args, executablePath: await chromium.executablePath() };
      })();

  const browser = await puppeteer.launch({
    args,
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(await buildHtml(props), { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
