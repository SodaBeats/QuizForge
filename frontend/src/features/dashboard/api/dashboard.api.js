import { apiRequest } from "../../../lib/api.js";

export function formatSubmissionCount(exam) {
  if (exam.accessibility === "restricted") {
    return `${exam.submittedCount} / ${exam.assignedCount}`;
  }
  return String(exam.submittedCount);
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
