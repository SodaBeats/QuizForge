import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./components/AuthProvider.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import { isConfigured } from "./lib/env.js";
import { queryClient } from "./lib/queryClient.js";

// One env check at the entry (Phase 1.1 / F3): the whole app only mounts when
// the backend origin is configured — components no longer check it themselves.
if (!isConfigured) {
  console.error("Missing VITE_BACKEND_HOST env variable");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <ErrorPage />
    )}
  </StrictMode>,
);
