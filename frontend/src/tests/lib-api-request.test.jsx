import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, apiRequest, configureApiClient } from "../lib/api.js";

const json = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

describe("lib/api — apiRequest", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    configureApiClient({
      getAccessToken: () => "token",
      refresh: vi.fn(async () => null),
      onUnauthorized: vi.fn(),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves the backend host and returns the parsed body", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, value: 42 }));

    const result = await apiRequest("/api/thing");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/api/thing",
    );
    expect(result).toEqual({ success: true, value: 42 });
  });

  it("turns express-validator errors into one ApiError message", async () => {
    fetchMock.mockResolvedValue(
      json(400, { errors: [{ msg: "Email is required" }, { msg: "Bad token" }] }),
    );

    await expect(apiRequest("/api/thing")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Email is required, Bad token",
    });
  });

  it("uses the caller fallback for an empty error body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(
      apiRequest("/api/thing", {}, { fallbackMessage: "Could not save" }),
    ).rejects.toEqual(
      expect.objectContaining({ name: "ApiError", message: "Could not save" }),
    );
  });

  it("resolves 204 to null", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiRequest("/api/thing", { method: "DELETE" })).resolves.toBe(
      null,
    );
  });

  it("is an ApiError subclass", () => {
    expect(new ApiError("boom")).toBeInstanceOf(Error);
  });
});
