import colors from "./src/theme/colors.js";

/**
 * Emits the flat palette from src/theme/colors.js as :root CSS variables so
 * plain CSS files (Login.css, StudentTokenPage.css, ...) and inline styles
 * share the same single source of truth:
 *   --surface: #26211c;             (the color)
 *   --surface-rgb: 38 33 28;        (channels, for rgb(var(--surface-rgb) / a))
 *
 * The `muted` token doubles as the hairline border color, so it is meant to be
 * used with an alpha modifier (border-muted/20, bg-muted/10).
 */
function colorVarsPlugin({ addBase }) {
  const vars = {};
  for (const [name, value] of Object.entries(colors)) {
    vars[`--${name}`] = value;
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    vars[`--${name}-rgb`] = `${r} ${g} ${b}`;
  }
  addBase({ ":root": vars });
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
      fontFamily: {
        display: ["Baloo 2", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [colorVarsPlugin],
}
