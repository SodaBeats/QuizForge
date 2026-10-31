import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { App } from "./app/App.jsx";
import { AppProviders } from "./app/providers/index.jsx";
import { ErrorPage } from "./app/ErrorPage.jsx";
import { isConfigured } from "./lib/env.js";

// One env check at the entry (Phase 1.1 / F3): the whole app only mounts when
// the backend origin is configured — components no longer check it themselves.
if (!isConfigured) {
  console.error("Missing VITE_BACKEND_HOST env variable");
}

// Providers (auth + query) are composed in app/providers and wrap the app;
// BrowserRouter stays here because AuthProvider uses useNavigate.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    ) : (
      <ErrorPage />
    )}
  </StrictMode>,
);
