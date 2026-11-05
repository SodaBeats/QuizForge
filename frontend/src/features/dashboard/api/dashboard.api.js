/* Teacher-dashboard data — MOCK ONLY (backend out of scope for this feature).

   Shapes are aligned with the stubbed `GET /api/dashboards` route
   (backend/src/routes/dashboards.route.ts) and its repositories so the real
   swap touches only this file — keep the signatures and return shapes:
   - active exam  = status "published" && dueDate > now
     (UserQuizzesRepository.countActiveExams)
   - expiring soon = active && dueDate <= now + `hours`
     (UserQuizzesRepository.getClosingSoonExams, default hours = 72)
   - average score = mean of per-exam averages over exams with attempts,
     rounded to 1 decimal (the repo rounds avg(score) to 1)

   Submission rate is derived here, not stored: submittedCount / assignedCount. */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const DASHBOARD_PAGE_SIZE = 5;
export const EXPIRING_WINDOW_HOURS = 72;
export const MOCK_TOTAL_STUDENTS = 87;
const MOCK_DELAY_MS = 250;

// Dates are relative to load time so the 72h window stays meaningful in
// tests and in the UI no matter when the app runs.
const atHour = (hours) => new Date(Date.now() + hours * HOUR_MS).toISOString();
const atDay = (days) => new Date(Date.now() + days * DAY_MS).toISOString();

// 12 published (7 due within 72h) + 4 drafts — enough for 3 and 2 pages
// respectively at DASHBOARD_PAGE_SIZE.
const MOCK_EXAMS = [
  // Due within 72 hours
  {
    id: 1,
    quizTitle: "Calculus II Midterm",
    dueDate: atHour(2),
    status: "published",
    assignedCount: 30,
    submittedCount: 28,
    averageScore: 78.4,
  },
  {
    id: 2,
    quizTitle: "Physics: Kinematics Quiz",
    dueDate: atHour(9),
    status: "published",
    assignedCount: 30,
    submittedCount: 17,
    averageScore: 66.2,
  },
  {
    id: 3,
    quizTitle: "Chemistry: Stoichiometry",
    dueDate: atHour(26),
    status: "published",
    assignedCount: 28,
    submittedCount: 12,
    averageScore: 71.5,
  },
  {
    id: 4,
    quizTitle: "Biology: Cell Division",
    dueDate: atHour(44),
    status: "published",
    assignedCount: 26,
    submittedCount: 9,
    averageScore: null,
  },
  {
    id: 5,
    quizTitle: "World History Unit 4",
    dueDate: atHour(55),
    status: "published",
    assignedCount: 25,
    submittedCount: 4,
    averageScore: null,
  },
  {
    id: 6,
    quizTitle: "English Literature Essay Test",
    dueDate: atHour(66),
    status: "published",
    assignedCount: 24,
    submittedCount: 3,
    averageScore: 84,
  },
  {
    id: 7,
    quizTitle: "Programming Fundamentals",
    dueDate: atHour(71),
    status: "published",
    assignedCount: 30,
    submittedCount: 2,
    averageScore: null,
  },
  // Due later than 72 hours
  {
    id: 8,
    quizTitle: "Linear Algebra Final Review",
    dueDate: atDay(4),
    status: "published",
    assignedCount: 30,
    submittedCount: 21,
    averageScore: 82.3,
  },
  {
    id: 9,
    quizTitle: "Data Structures: Trees",
    dueDate: atDay(6),
    status: "published",
    assignedCount: 29,
    submittedCount: 14,
    averageScore: 74.6,
  },
  {
    id: 10,
    quizTitle: "Algorithms: Sorting",
    dueDate: atDay(9),
    status: "published",
    assignedCount: 29,
    submittedCount: 6,
    averageScore: 90.1,
  },
  {
    id: 11,
    quizTitle: "Discrete Math: Proofs",
    dueDate: atDay(14),
    status: "published",
    assignedCount: 27,
    submittedCount: 2,
    averageScore: null,
  },
  {
    id: 12,
    quizTitle: "Software Engineering Capstone",
    dueDate: atDay(21),
    status: "published",
    assignedCount: 26,
    submittedCount: 0,
    averageScore: null,
  },
  // Drafts — never active, never expiring
  {
    id: 13,
    quizTitle: "Geography Draft",
    dueDate: atDay(3),
    status: "draft",
    assignedCount: 0,
    submittedCount: 0,
    averageScore: null,
  },
  {
    id: 14,
    quizTitle: "Physics Lab Prelab",
    dueDate: atDay(5),
    status: "draft",
    assignedCount: 0,
    submittedCount: 0,
    averageScore: null,
  },
  {
    id: 15,
    quizTitle: "Philosophy 101 Quiz",
    dueDate: atDay(8),
    status: "draft",
    assignedCount: 0,
    submittedCount: 0,
    averageScore: null,
  },
  {
    id: 16,
    quizTitle: "Art History Sketch",
    dueDate: atDay(12),
    status: "draft",
    assignedCount: 0,
    submittedCount: 0,
    averageScore: null,
  },
];

// Simulated latency so loading states are real in the UI.
const delay = (ms = MOCK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isActive = (exam, now) =>
  exam.status === "published" && Date.parse(exam.dueDate) > now;

const bySoonestDue = (a, b) =>
  Date.parse(a.dueDate) - Date.parse(b.dueDate) || a.id - b.id;

const paginate = (items, page, pageSize) => {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
};

/** 0–100 percent (integer) of submissions vs assignments; 0 when unassigned. */
export function submissionRate(exam) {
  if (!exam.assignedCount) return 0;
  return Math.round((exam.submittedCount / exam.assignedCount) * 100);
}

export const dashboardApi = {
  async getStats() {
    await delay();
    const now = Date.now();
    const scored = MOCK_EXAMS.filter((exam) => exam.averageScore != null);
    const mean = scored.length
      ? scored.reduce((sum, exam) => sum + exam.averageScore, 0) / scored.length
      : 0;

    return {
      activeExams: MOCK_EXAMS.filter((exam) => isActive(exam, now)).length,
      totalStudents: MOCK_TOTAL_STUDENTS,
      averageScore: Math.round(mean * 10) / 10,
      drafts: MOCK_EXAMS.filter((exam) => exam.status === "draft").length,
    };
  },

  async getActiveExams({
    page = 1,
    pageSize = DASHBOARD_PAGE_SIZE,
  } = {}) {
    await delay();
    const now = Date.now();
    const active = MOCK_EXAMS.filter((exam) => isActive(exam, now)).sort(
      bySoonestDue,
    );
    return paginate(active, page, pageSize);
  },

  async getExpiringExams({
    page = 1,
    pageSize = DASHBOARD_PAGE_SIZE,
    hours = EXPIRING_WINDOW_HOURS,
  } = {}) {
    await delay();
    const now = Date.now();
    const cutoff = now + hours * HOUR_MS;
    const expiring = MOCK_EXAMS.filter(
      (exam) => isActive(exam, now) && Date.parse(exam.dueDate) <= cutoff,
    ).sort(bySoonestDue);
    return paginate(expiring, page, pageSize);
  },
};
