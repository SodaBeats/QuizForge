import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    // Hermetic: source modules read import.meta.env.VITE_BACKEND_HOST at module
    // top (e.g. StudentQuizPage), so tests must not depend on a local .env —
    // frontend/.env is gitignored and missing on fresh clones.
    env: { VITE_BACKEND_HOST: 'http://localhost:3000' },
    // globals intentionally OFF: tests import describe/it/expect explicitly from
    // 'vitest' so the browser-globals-only flat ESLint config stays green.
  },
})
