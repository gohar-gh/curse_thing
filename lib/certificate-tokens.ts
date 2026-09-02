// Literal (non-CSS-variable) design tokens for the <Certificate> component.
// Satori (used for PNG generation) does not resolve CSS custom properties
// reliably in inline styles, so the certificate uses these literal values
// instead of the var(--*) tokens used elsewhere in the app. Keep these in
// sync with app/globals.css if the palette ever changes.
export const tokens = {
  paper: "#E7EBE2",
  ink: "#16211B",
  inkSoft: "#4A5A50",
  green: "#2F4F3E",
  seal: "#6E2418",
  gold: "#9C7F3A",
  rule: "rgba(22,33,27,.22)",
  certSurface: "#F4F6EF",
  sealText: "#F0E4DC",
} as const;

export const FONT_SERIF = '"EB Garamond", Georgia, serif';
export const FONT_MONO = '"IBM Plex Mono", monospace';
export const FONT_ARMENIAN = '"Noto Serif Armenian", "EB Garamond", Georgia, serif';

/**
 * IBM Plex Mono has no Armenian coverage, so for the hy locale every label
 * on the certificate (including the mono meta/clause text) falls back to
 * Noto Serif Armenian rather than rendering as tofu. English and Russian
 * keep the intended serif/mono split from the prototype.
 */
export function certFonts(locale: "hy" | "en" | "ru") {
  if (locale === "hy") {
    return { serif: FONT_ARMENIAN, mono: FONT_ARMENIAN };
  }
  return { serif: FONT_SERIF, mono: FONT_MONO };
}
