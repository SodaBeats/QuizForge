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

/* Students who attempted either mock exam. classIds matter for the
   restricted exam (Phase 3 tabs); the open exam's students have none. */
export const MOCK_STUDENTS = [
  // Exam "1" — restricted to Section A (1) / Section B (2); Farah is in both.
  { id: 101, name: "Alice Nguyen", classIds: [1] },
  { id: 102, name: "Brian Okafor", classIds: [1] },
  { id: 103, name: "Carla Mendes", classIds: [1] },
  { id: 104, name: "Diego Fernandez", classIds: [2] },
  { id: 105, name: "Emma Lindqvist", classIds: [2] },
  { id: 106, name: "Farah Haddad", classIds: [1, 2] },
  // Exam "2" — open to anyone.
  { id: 201, name: "Grace Kim", classIds: [] },
  { id: 202, name: "Hugo Martins", classIds: [] },
  { id: 203, name: "Isla Petrov", classIds: [] },
  { id: 204, name: "Jonas Weber", classIds: [] },
  { id: 205, name: "Keiko Tanaka", classIds: [] },
  { id: 206, name: "Liam O'Connor", classIds: [] },
  { id: 207, name: "Maya Sharma", classIds: [] },
  { id: 208, name: "Noah Bergstrom", classIds: [] },
  { id: 209, name: "Olivia Costa", classIds: [] },
  { id: 210, name: "Pedro Alvarez", classIds: [] },
];

/* Completed attempts keyed by exam id: exam "1" → 6 students / 8 attempts,
   exam "2" → 10 students / 14 attempts (four students on their 2nd try). */
export const MOCK_ATTEMPTS = {
  "1": [
    { id: 1001, studentId: 101, rawScore: 18, maxPossibleScore: 25, submittedAt: "2026-11-18T09:30:00.000Z", status: "completed" },
    { id: 1002, studentId: 101, rawScore: 22, maxPossibleScore: 25, submittedAt: "2026-11-19T14:15:00.000Z", status: "completed" },
    { id: 1003, studentId: 102, rawScore: 15, maxPossibleScore: 25, submittedAt: "2026-11-18T10:05:00.000Z", status: "completed" },
    { id: 1004, studentId: 103, rawScore: 25, maxPossibleScore: 25, submittedAt: "2026-11-19T08:45:00.000Z", status: "completed" },
    { id: 1005, studentId: 104, rawScore: 12, maxPossibleScore: 25, submittedAt: "2026-11-17T16:20:00.000Z", status: "completed" },
    { id: 1006, studentId: 105, rawScore: 20, maxPossibleScore: 25, submittedAt: "2026-11-19T11:10:00.000Z", status: "completed" },
    { id: 1007, studentId: 106, rawScore: 19, maxPossibleScore: 25, submittedAt: "2026-11-18T13:00:00.000Z", status: "completed" },
    { id: 1008, studentId: 106, rawScore: 21, maxPossibleScore: 25, submittedAt: "2026-11-19T15:40:00.000Z", status: "completed" },
  ],
  "2": [
    { id: 2001, studentId: 201, rawScore: 7, maxPossibleScore: 10, submittedAt: "2026-11-05T09:00:00.000Z", status: "completed" },
    { id: 2002, studentId: 201, rawScore: 9, maxPossibleScore: 10, submittedAt: "2026-11-06T10:30:00.000Z", status: "completed" },
    { id: 2003, studentId: 202, rawScore: 6, maxPossibleScore: 10, submittedAt: "2026-11-05T09:20:00.000Z", status: "completed" },
    { id: 2004, studentId: 203, rawScore: 4, maxPossibleScore: 10, submittedAt: "2026-11-05T09:40:00.000Z", status: "completed" },
    { id: 2005, studentId: 203, rawScore: 8, maxPossibleScore: 10, submittedAt: "2026-11-06T11:15:00.000Z", status: "completed" },
    { id: 2006, studentId: 204, rawScore: 10, maxPossibleScore: 10, submittedAt: "2026-11-05T10:00:00.000Z", status: "completed" },
    { id: 2007, studentId: 205, rawScore: 5, maxPossibleScore: 10, submittedAt: "2026-11-05T10:25:00.000Z", status: "completed" },
    { id: 2008, studentId: 206, rawScore: 3, maxPossibleScore: 10, submittedAt: "2026-11-05T10:50:00.000Z", status: "completed" },
    { id: 2009, studentId: 206, rawScore: 6, maxPossibleScore: 10, submittedAt: "2026-11-06T12:05:00.000Z", status: "completed" },
    { id: 2010, studentId: 207, rawScore: 8, maxPossibleScore: 10, submittedAt: "2026-11-05T11:10:00.000Z", status: "completed" },
    { id: 2011, studentId: 208, rawScore: 9, maxPossibleScore: 10, submittedAt: "2026-11-05T11:35:00.000Z", status: "completed" },
    { id: 2012, studentId: 209, rawScore: 2, maxPossibleScore: 10, submittedAt: "2026-11-05T12:00:00.000Z", status: "completed" },
    { id: 2013, studentId: 209, rawScore: 7, maxPossibleScore: 10, submittedAt: "2026-11-06T13:20:00.000Z", status: "completed" },
    { id: 2014, studentId: 210, rawScore: 5, maxPossibleScore: 10, submittedAt: "2026-11-05T12:30:00.000Z", status: "completed" },
  ],
};
