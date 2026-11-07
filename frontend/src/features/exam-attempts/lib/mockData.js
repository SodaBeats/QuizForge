/* Static mock data for the Exam Attempts page (frontend only — no API).
   Keys of MOCK_EXAMS are the quizIds used in the URL: "1" = restricted,
   "2" = open to anyone. Unknown ids must render the not-found state. */

const RESTRICTED_CLASSES = [
  { id: 1, name: "Section A" },
  { id: 2, name: "Section B" },
];

export const MOCK_EXAMS = {
  "1": {
    id: "1",
    title: "Midterm: Algebra II",
    description:
      "Covers linear equations, polynomials, and quadratic functions from units 1–4.",
    questionCount: 25,
    maxAttempts: 3,
    dueDate: "2026-11-20T23:59:00.000Z",
    createdAt: "2026-10-28T09:15:00.000Z",
    status: "published",
    accessibility: "restricted",
    allowedClasses: RESTRICTED_CLASSES,
    shareToken: "alg2midterm",
  },
  "2": {
    id: "2",
    title: "Weekly Quiz: World History",
    description:
      "Short quiz on the Enlightenment and the French Revolution. Open to anyone with the link.",
    questionCount: 10,
    maxAttempts: 2,
    dueDate: "2026-11-14T23:59:00.000Z",
    createdAt: "2026-11-01T14:00:00.000Z",
    status: "published",
    accessibility: "anyone",
    allowedClasses: [],
    shareToken: "wkhistry01",
  },
};

/* Students and attempts are added in Phase 2 — exported empty for now so
   the attempts panel can be wired without changing imports later. */
export const MOCK_STUDENTS = [];
export const MOCK_ATTEMPTS = {};
