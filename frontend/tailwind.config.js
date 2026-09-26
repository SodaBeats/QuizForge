import colors from "./src/theme/colors.js";

/**
 * Emits the palette from src/theme/colors.js as :root CSS variables so
 * plain CSS files (Login.css, StudentTokenPage.css, ...) and inline styles
 * share the same single source of truth:
 *   --surface-900: #26211c;         (the color)
 *   --surface-900-rgb: 38 33 28;    (channels, for rgb(var(--x-rgb) / a))
 */
function colorVarsPlugin({ addBase }) {
  const vars = {};
  for (const [group, shades] of Object.entries(colors)) {
    for (const [shade, value] of Object.entries(shades)) {
      vars[`--${group}-${shade}`] = value;
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      vars[`--${group}-${shade}-rgb`] = `${r} ${g} ${b}`;
    }
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
      animation: {
        'sheen': 'sheen 3s ease-in-out infinite',
      },
      keyframes: {
        sheen: {
          '0%': { transform: 'translateX(-100%) translateY(100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) translateY(-100%) rotate(45deg)' },
        }
      }
    },
  },
  plugins: [colorVarsPlugin],
}
