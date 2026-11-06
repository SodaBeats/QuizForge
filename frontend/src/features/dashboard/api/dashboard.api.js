import { apiRequest } from "../../../lib/api.js";

/** 0–100 percent (integer) of submissions vs assignments; 0 when unassigned. */
export function submissionRate(exam) {
  if (!exam.assignedCount) return 0;
  return Math.round((exam.submittedCount / exam.assignedCount) * 100);
}

export const dashboardApi = {
  getStats() {
    return apiRequest("/api/dashboard/stats", {}, {
      fallbackMessage: "Failed to fetch dashboard stats",
    });
  },

  getActiveExams({ page = 1 } = {}) {
    const params = new URLSearchParams({ page: String(page) });
    return apiRequest(`/api/dashboard/active-exams?${params}`, {}, {
      fallbackMessage: "Failed to fetch active exams",
    });
  },

  getExpiringExams({ page = 1 } = {}) {
    const params = new URLSearchParams({ page: String(page) });
    return apiRequest(`/api/dashboard/expiring?${params}`, {}, {
      fallbackMessage: "Failed to fetch expiring exams",
    });
  },
};
