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
 *   accent  — brand orange: solid buttons, focus rings, selected/active state
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
  canvas: "#1B262D",
  surface: "#1B262D",
  ink: "#0C171D",
  inkondark: "#F8FAFC",
  muted: "#6E92A9",
  accent: "#4E7385",
  specialsurface: "#012C36",
  specialheader: "#0C171D",
  accept: "#22C55E",
  darkslate: "#1E293B", //-------------------------------------
  paleblue: "#96B9C9",
  offwhite: "#F8FAFC", // text on dark
  mutedblue: "#6E92A9",
  steelblue: "#4E7385",
  tealgray: "#395A69",
  mutedteal: "#2B4552",
  bluegray: "#20343F", // main dark surface
  deepbluegray: "#1B262D", //dark neutral
  darkteal: "#012C36",
  blackblue: "#0C171D",
};

export default colors;
