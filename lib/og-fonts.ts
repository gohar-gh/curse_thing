import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SatoriOptions } from "satori";

// Satori (used for PNG generation via app/api/og/[slug]) cannot decode
// woff2 — only ttf/otf/woff. These files are separate from the browser's
// self-hosted woff2 set in public/fonts/ and exist only for this pipeline.
const DIR = join(process.cwd(), "lib", "og-fonts");

function load(filename: string): Buffer {
  return readFileSync(join(DIR, filename));
}

let cached: SatoriOptions["fonts"] | null = null;

export function loadOgFonts(): SatoriOptions["fonts"] {
  if (cached) return cached;

  cached = [
    { name: "EB Garamond", data: load("EBGaramond-400.woff"), weight: 400, style: "normal" },
    { name: "EB Garamond", data: load("EBGaramond-500.woff"), weight: 500, style: "normal" },
    { name: "EB Garamond", data: load("EBGaramond-600.woff"), weight: 600, style: "normal" },
    { name: "EB Garamond", data: load("EBGaramond-Italic400.woff"), weight: 400, style: "italic" },
    { name: "IBM Plex Mono", data: load("IBMPlexMono-400.woff"), weight: 400, style: "normal" },
    { name: "IBM Plex Mono", data: load("IBMPlexMono-500.woff"), weight: 500, style: "normal" },
    { name: "Noto Serif Armenian", data: load("NotoSerifArmenian-400.woff"), weight: 400, style: "normal" },
    { name: "Noto Serif Armenian", data: load("NotoSerifArmenian-500.woff"), weight: 500, style: "normal" },
    { name: "Noto Serif Armenian", data: load("NotoSerifArmenian-600.woff"), weight: 600, style: "normal" },
  ];

  return cached;
}
