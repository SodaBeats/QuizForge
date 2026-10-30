/* Document list/content/upload network calls (Phase 2.3). */

import { ApiError, apiRequest } from "../../../lib/api.js";

export const documentsApi = {
  list(page = 0) {
    const offset = page * 5;
    const limit = 5;
    return apiRequest(
      `/api/documents?limit=${limit}&offset=${offset}`,
      {},
      { fallbackMessage: "Failed to fetch documents" },
    );
  },

  listAll() {
    return apiRequest("/api/documents", {}, {
      fallbackMessage: "Failed to fetch documents",
    });
  },

  content(id) {
    return apiRequest(`/api/documents/${id}`, {}, {
      fallbackMessage: "Failed to load this file",
    });
  },

  async upload(file) {
    const body = new FormData();
    body.append("file", file);

    const result = await apiRequest(
      "/api/upload",
      { method: "POST", body },
      { fallbackMessage: "Failed to upload file" },
    );

    // /api/upload answers 200 even for a handled extraction failure.
    if (result?.success === false) {
      throw new ApiError(result.error || "Failed to upload file", {
        payload: result,
      });
    }

    return result;
  },
};
