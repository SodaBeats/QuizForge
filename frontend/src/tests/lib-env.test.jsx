import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";

// Characterization of the Phase 1.1 entry check: with no backend origin the
// app must mount ErrorPage instead of the router/app tree (this replaced the
// 9 per-component <Navigate to="/error"> guards).
describe("app entry (main.jsx) env check", () => {
  beforeEach(() => {
    vi.resetModules(); // so lib/env.js re-reads the (stubbed) env on import
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("mounts ErrorPage instead of the app when VITE_BACKEND_HOST is missing", async () => {
    vi.stubEnv("VITE_BACKEND_HOST", "");
    vi.spyOn(console, "error").mockImplementation(() => {}); // silences the entry log + React act noise

    await import("../main.jsx");

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });
});
