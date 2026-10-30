/* Auth endpoints (Phase 2.3 / F18).

   These deliberately bypass the authenticated api client: login/signup have
   no token yet, and refresh/logout already carry the http-only cookie. Using
   raw fetch here avoids a 401 from /auth/refresh triggering another refresh. */

import { backendHost } from "../../../lib/env.js";
import {
  ApiError,
  getApiErrorMessage,
  parseApiBody,
} from "../../../lib/api.js";

async function publicRequest(path, { method = "GET", body } = {}, fallback) {
  const response = await fetch(`${backendHost}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseApiBody(response);

  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(payload, fallback), {
      status: response.status,
      payload,
    });
  }

  return payload;
}

export const authApi = {
  login: (credentials) =>
    publicRequest(
      "/auth/login",
      { method: "POST", body: credentials },
      "Failed to log in",
    ),

  signup: (details) =>
    publicRequest(
      "/auth/signup",
      { method: "POST", body: details },
      "Failed to create account",
    ),

  refresh: () =>
    publicRequest("/auth/refresh", { method: "POST" }, "Session expired"),

  logout: () =>
    publicRequest("/auth/logout", { method: "POST" }, "Failed to log out"),
};
