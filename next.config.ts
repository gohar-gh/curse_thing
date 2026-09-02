import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // These ship native bindings / WASM assets that Turbopack's bundler
  // doesn't resolve correctly (native .node binaries, harfbuzz .wasm) —
  // excluding them from bundling lets Node's normal require() handle them.
  serverExternalPackages: [
    "satori",
    "@resvg/resvg-js",
    "sharp",
    "puppeteer-core",
    "@sparticuz/chromium",
  ],
};

export default withNextIntl(nextConfig);
