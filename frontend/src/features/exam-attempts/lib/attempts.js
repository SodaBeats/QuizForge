/* Pure helpers for the Exam Attempts page — the high-risk logic lives here
   so it stays testable without rendering (Phase 4). */

import { MOCK_EXAMS } from "./mockData.js";

/** Mock exam for a URL quizId, or undefined for unknown ids (→ not-found). */
export function getExam(quizId) {
  return MOCK_EXAMS[String(quizId)];
}
