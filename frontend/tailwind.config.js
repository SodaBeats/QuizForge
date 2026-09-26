import colors from "./src/theme/colors.js";

/**
 * Emits the palette from src/theme/colors.js as :root CSS variables
 * (e.g. --surface-900, --brand-500) so plain CSS files (Login.css,
 * StudentTokenPage.css, ...) share the same single source of truth.
 */
function colorVarsPlugin({ addBase }) {
  const vars = {};
  for (const [group, shades] of Object.entries(colors)) {
    for (const [shade, value] of Object.entries(shades)) {
      vars[`--${group}-${shade}`] = value;
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
