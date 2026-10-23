import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createApiClient,
  getApiErrorMessage,
  parseApiBody,
} from "../lib/api.js";

const json = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

describe("lib/api — createApiClient", () => {
  let fetchMock;

  const makeClient = ({ token = "old-token", newToken = "new-token" } = {}) => {
    const getAccessToken = vi.fn(() => token);
    const refresh = vi.fn(async () => newToken);
    const onUnauthorized = vi.fn();
    const apiFetch = createApiClient({
      getAccessToken,
      refresh,
      onUnauthorized,
    });
    return { apiFetch, getAccessToken, refresh, onUnauthorized };
  };

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the auth header, JSON content-type, and credentials: include", async () => {
    const { apiFetch } = makeClient();
    fetchMock.mockResolvedValue(json(200, { ok: true }));

    await apiFetch("http://x/api", { method: "POST", body: '{"a":1}' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe("Bearer old-token");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.credentials).toBe("include");
  });

  it("does not set Content-Type for FormData bodies, but still sends credentials", async () => {
    const { apiFetch } = makeClient();
    fetchMock.mockResolvedValue(json(200, {}));
    const fd = new FormData();
    fd.append("file", "x");

    await apiFetch("http://x/upload", { method: "POST", body: fd });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.headers.authorization).toBe("Bearer old-token");
    expect(init.credentials).toBe("include");
  });

  it("preserves caller-supplied headers", async () => {
    const { apiFetch } = makeClient();
    fetchMock.mockResolvedValue(json(200, {}));

    await apiFetch("http://x/api", { headers: { "x-custom": "yes" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["x-custom"]).toBe("yes");
    expect(init.headers.authorization).toBe("Bearer old-token");
  });

  it("on 401: refreshes once and retries with the new token", async () => {
    const { apiFetch, refresh, onUnauthorized } = makeClient();
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, { ok: true }));

    const resp = await apiFetch("http://x/api");

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(resp.status).toBe(200);
    const [, retryInit] = fetchMock.mock.calls[1];
    expect(retryInit.headers.authorization).toBe("Bearer new-token");
    expect(retryInit.credentials).toBe("include");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("when refresh cannot save the session: calls onUnauthorized and throws ApiError 401", async () => {
    const { apiFetch, refresh, onUnauthorized } = makeClient({
      newToken: null, // not undefined — a destructuring default would kick in
    });
    fetchMock.mockResolvedValue(json(401, {}));

    await expect(apiFetch("http://x/api")).rejects.toMatchObject({
      name: "ApiError",
      message: "Session expired",
      status: 401,
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("two parallel 401s share a single refresh (single-flight)", async () => {
    const { apiFetch, refresh } = makeClient();
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValue(json(200, {}));

    const [r1, r2] = await Promise.all([
      apiFetch("http://x/a"),
      apiFetch("http://x/b"),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4); // 2 first attempts + 2 retries
  });
});

describe("lib/api — error normalization helpers", () => {
  it("joins validation errors[].msg", () => {
    expect(
      getApiErrorMessage(
        { errors: [{ msg: "Title required" }, { msg: "Bad type" }] },
        "fallback",
      ),
    ).toBe("Title required, Bad type");
  });

  it("uses a plain payload.message", () => {
    expect(getApiErrorMessage({ message: "Forbidden action" }, "fallback")).toBe(
      "Forbidden action",
    );
  });

  it("falls back when neither shape is present", () => {
    expect(getApiErrorMessage({}, "fallback")).toBe("fallback");
    expect(getApiErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getApiErrorMessage({ errors: [] }, "fallback")).toBe("fallback");
  });

  it("parseApiBody: 204 → null, JSON → parsed, unparsable → null", async () => {
    await expect(
      parseApiBody(new Response(null, { status: 204 })),
    ).resolves.toBeNull();
    await expect(parseApiBody(json(200, { a: 1 }))).resolves.toEqual({ a: 1 });
    await expect(
      parseApiBody(new Response("nope", { status: 200 })),
    ).resolves.toBeNull();
  });
});
