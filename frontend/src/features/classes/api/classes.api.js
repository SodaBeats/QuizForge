/* Every /api/classes* network call (Phase 2.3 / F2). */

import { apiRequest } from "../../../lib/api.js";

const jsonRequest = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const classesApi = {
  async list() {
    const result = await apiRequest(
      "/api/classes",
      {},
      { fallbackMessage: "Failed to fetch classes" },
    );
    return result.classArray;
  },

  create(form) {
    return apiRequest("/api/classes", jsonRequest("POST", form), {
      fallbackMessage: "Failed to create class",
    });
  },

  addStudent(classId, form) {
    return apiRequest(
      `/api/classes/${classId}/students`,
      jsonRequest("POST", form),
      { fallbackMessage: "Failed to add student" },
    );
  },

  removeStudent(classId, studentId) {
    return apiRequest(
      `/api/classes/${classId}/students/${studentId}`,
      { method: "DELETE" },
      { fallbackMessage: "Failed to remove student" },
    );
  },

  remove(classId) {
    return apiRequest(`/api/classes/${classId}`, { method: "DELETE" }, {
      fallbackMessage: "Failed to delete class",
    });
  },

  findStudent(classId, email) {
    return apiRequest(
      `/api/classes/${classId}/students/find?email=${encodeURIComponent(email)}`,
      {},
      { fallbackMessage: "Email validation failed" },
    );
  },
};
