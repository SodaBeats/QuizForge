/* Daily token-budget usage (GET /api/token-usage). */

import { apiRequest } from "../../../lib/api.js";

export const tokenUsageApi = {
  get() {
    return apiRequest("/api/token-usage", {}, {
      fallbackMessage: "Failed to fetch token usage",
    });
  },
};
