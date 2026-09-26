/**
 * QuizForge color tokens — single source of truth.
 *
 * Loaded by `tailwind.config.js`, which:
 *   1. exposes them as Tailwind colors (bg-surface-900, text-brand-500, ...)
 *   2. emits them as :root CSS variables (--surface-900, --brand-500, ...)
 *      for use in plain CSS files (Login.css, StudentTokenPage.css, ...)
 *
 * Import this module in JSX when a raw value is needed in an inline style:
 *   import { colors } from "../theme/colors";
 *   style={{ background: colors.surface[900] }}
 *
 * Palette roles:
 *   surface — dark warm gray: page backgrounds, elevated surfaces, borders
 *   brand   — orange: accent, interactive elements (buttons, focus, selected)
 *   ink     — white/cream: text and light surfaces
 *
 * Status colors (red/green/amber) intentionally use the Tailwind defaults
 * and are not defined here.
 */
export const colors = {
  surface: {
    950: "#0d0906",
    900: "#26211c",
    800: "#322b23",
    700: "#3a3128",
    600: "#4a3f34",
    500: "#5c4f42",
  },
  brand: {
    100: "#fff0e6",
    300: "#ffab6b",
    400: "#ff9450",
    500: "#ff7a1a",
    600: "#e8752a",
    800: "#5c3512",
    900: "#3a2010",
  },
  ink: {
    50: "#ffffff",
    100: "#f5f2ec",
    200: "#e8ddce",
    300: "#cabaa2",
    400: "#a89a86",
    500: "#766a59",
    600: "#6b5f52",
  },
};

export default colors;
