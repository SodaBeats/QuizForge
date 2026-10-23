/* Single source of truth for the backend origin (Phase 1.1 / F3).
   Everything imports `backendHost` from here — never read
   import.meta.env.VITE_BACKEND_HOST anywhere else in src/.
   The app entry (main.jsx) is the only consumer of `isConfigured`. */

export const backendHost = import.meta.env.VITE_BACKEND_HOST;
export const isConfigured = Boolean(backendHost);
