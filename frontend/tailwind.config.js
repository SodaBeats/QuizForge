/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
  plugins: [],
}