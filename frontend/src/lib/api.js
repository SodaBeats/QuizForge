/* Shared API client (Phase 1.2 / F2). One owner of the auth header, the
   401 → refresh → retry flow, and the `credentials: "include"` default.

   AuthProvider builds one client and exposes it as `authFetch`, so every
   existing call site behaves exactly as before (the public context API is
   unchanged). Per-feature adoption of the normalization helpers happens in
   Phase 2. */

/** Error thrown by the client for transport/session failures.
    Carries the HTTP status and the parsed body (when one was attached). */
export class ApiError extends Error {
  constructor(message, { status = 0, payload = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/**
 * One place for the server-error → message mapping that call sites keep
 * re-implementing (validation `errors[]` from express-validator, a plain
 * `message` body, or a caller-supplied fallback).
 */
export function getApiErrorMessage(
  payload,
  fallback = "Something went wrong. Please try again.",
) {
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors.map((e) => e.msg).join(", ");
  }
  if (typeof payload?.message === "string" && payload.message) {
    return payload.message;
  }
  return fallback;
}

/** Safely read a response body: 204/no-content and unparsable bodies
    resolve to null instead of throwing. */
export async function parseApiBody(response) {
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Build an apiFetch bound to the app's session state.
 *
 * @param {object}   deps
 * @param {() => string | null} deps.getAccessToken   current access token (read at call time)
 * @param {() => Promise<string | null>} deps.refresh silent refresh; resolves to the new token or falsy
 * @param {() => void} deps.onUnauthorized            fired when the refresh cannot save the session
 */
export function createApiClient({ getAccessToken, refresh, onUnauthorized }) {
  // One refresh at a time: concurrent 401s share the same refresh promise
  // (this lived in AuthProvider as refreshPromiseRef before).
  let refreshPromise = null;

  return async function apiFetch(url, options = {}) {
    try {
      // get custom headers inside options and add authz
      const headers = {
        ...options.headers,
        authorization: `Bearer ${getAccessToken()}`,
      };

      // only add JSON content-type if not sending FormData
      if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      // the client always sends cookies (Phase 1.2 addition — the refresh
      // cookie flows with every request now, not just the ones that asked)
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // if the token expired (401 error), try to refresh it
      if (response.status === 401) {
        console.log("Token expired, attempting to refresh...");

        // prevent multiple simultaneous refresh calls
        if (!refreshPromise) {
          refreshPromise = Promise.resolve()
            .then(() => refresh())
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;

        if (newToken) {
          // retry with the fresh token
          headers["authorization"] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });
        } else {
          // the session is gone — let the app know, then fail this call
          onUnauthorized();
          throw new ApiError("Session expired", { status: 401 });
        }
      }

      return response;
    } catch (error) {
      console.error("apiFetch error: ", error);
      throw error;
    }
  };
}
