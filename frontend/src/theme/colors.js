/**
 * QuizForge color tokens — flat 5-token palette, single source of truth.
 *
 * Every token has exactly one value; there are no shades.
 *
 *   canvas  — page background (darkest)
 *   surface — panels, cards, sidebars, modals, inputs
 *   ink     — primary text
 *   muted   — secondary text (subtitles, placeholders, disabled) and hairline
 *             borders, applied through alpha modifiers:
 *               border-muted/20  → panel edge
 *               border-muted/30  → input / interactive edge
 *               bg-muted/10      → hover lift
 *   accent  — brand red: solid buttons, focus rings, selected/active state
 *
 * Loaded by `tailwind.config.js`, which:
 *   1. exposes them as Tailwind utilities (bg-canvas, text-ink, border-muted/20 …)
 *   2. emits them as :root CSS variables (--canvas, --surface, … plus
 *      --canvas-rgb, --surface-rgb …) for plain CSS files and inline styles.
 *
 * Import this module in JSX only when a raw value is needed inline:
 *   import { colors } from "../theme/colors";
 *   style={{ background: colors.accent }}
 */
export const colors = {
  surface: "#395A69",
  canvas: "#C3D1D5",
  ink: "#0C171D",
  inkondark: "#F8FAFC",
  muted: "#6E92A9",
  accent: "#A01412",
  specialsurface: "#0E112F",
  modalback: "#1B262D",
  accept: "#22C55E",
  darkslate: "#1E293B",
  mutedteal: "#2B4552",
  darkteal: "#012C36",
  ccdiblue: "#000B6D",
};

export default colors;
