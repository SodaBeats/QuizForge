/* Admin-panel API — the ONE module that knows whether /admin/* is mocked.

   USE_MOCKS flips the whole module at the network boundary: components call
   adminApi.* (or, more commonly, the hooks in queries.js / mutations.js)
   and cannot observe which side answered. Delete this flag and
   adminMockData.js once the backend ships the routes below.

   Contract (all lists: ?page=1&limit=10 in, { data: [...], total } out):
     GET   /admin/stats
     GET   /admin/users?role&page&limit&verified
     POST  /admin/users
     PATCH /admin/users/:id
     POST  /admin/users/:id/suspend | /unsuspend
     DELETE /admin/users/:id
     GET   /admin/exams?page&limit&sort=created_at_desc */

import { apiRequest } from "../../../lib/api.js";
import { handleMockAdminRequest } from "./adminMockData.js";

// Flip to false when the backend /admin/* routes are live.
export const USE_MOCKS = false;

function send(method, path, { body, fallbackMessage } = {}) {
  if (USE_MOCKS) {
    return handleMockAdminRequest({ method, path, body });
  }
  const options = { method };
  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  return apiRequest(path, options, { fallbackMessage });
}

export const adminApi = {
  getStats() {
    return send("GET", "/admin/stats", {
      fallbackMessage: "Failed to fetch admin stats",
    });
  },

  /** role: teacher|student|admin; verified: true|false (both optional). */
  getUsers({ role, page = 1, limit = 10, verified } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (role) params.set("role", role);
    if (verified !== undefined && verified !== null) {
      params.set("verified", String(verified));
    }
    return send("GET", `/admin/users?${params}`, {
      fallbackMessage: "Failed to fetch users",
    });
  },

  /** body: { first_name, last_name, email, password, role, is_verified } */
  createUser(body) {
    return send("POST", "/admin/users", {
      body,
      fallbackMessage: "Failed to create user",
    });
  },

  /** body: { role?, is_verified? } */
  updateUser(id, body) {
    return send("PATCH", `/admin/users/${id}`, {
      body,
      fallbackMessage: "Failed to update user",
    });
  },

  suspendUser(id) {
    return send("POST", `/admin/users/${id}/suspend`, {
      fallbackMessage: "Failed to suspend user",
    });
  },

  unsuspendUser(id) {
    return send("POST", `/admin/users/${id}/unsuspend`, {
      fallbackMessage: "Failed to unsuspend user",
    });
  },

  deleteUser(id) {
    return send("DELETE", `/admin/users/${id}`, {
      fallbackMessage: "Failed to delete user",
    });
  },

  getExams({ page = 1, limit = 10, sort = "created_at_desc" } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
    });
    return send("GET", `/admin/exams?${params}`, {
      fallbackMessage: "Failed to fetch exams",
    });
  },
};
