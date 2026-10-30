/* One vocabulary for every cached endpoint (Phase 2.1 / F1).

   Each URL has exactly one key builder. Prefix keys (`all`) are what
   invalidations target, so an edit in the quiz maker also reaches the
   quizzes page even though they mount different queries. */

export const quizKeys = {
  all: ["quizzes"],
  // Every quiz-list cache (unpaginated + each page) shares this prefix.
  lists: ["quizzes", "list"],
  // list() = GET /api/quizzes (unpaginated)
  // list({ page }) = GET /api/quizzes?limit=&offset= (paginated)
  list: (params = null) => [...quizKeys.lists, params],
  detail: (id) => [...quizKeys.all, "detail", id],
  // ONE key for GET /api/quizzes/questions?quizId=… (was queryQuestions + quizQuestions)
  questions: (id) => [...quizKeys.all, id, "questions"],
  dashboard: (id) => [...quizKeys.all, id, "dashboard"],
};

export const classKeys = {
  all: ["classes"],
  list: ["classes", "list"],
  detail: (id) => [...classKeys.all, "detail", id],
  studentLookup: (classId, email) => [
    ...classKeys.all,
    "student-lookup",
    classId,
    email,
  ],
};

export const docKeys = {
  all: ["documents"],
  // list(page) = paginated document picker; the content sources dropdown
  // reads the whole list under allList.
  list: (page = 0) => [...docKeys.all, "list", page],
  allList: ["documents", "list", "all"],
  content: (id) => [...docKeys.all, "content", id],
};

export const attemptKeys = {
  all: ["attempts"],
  quiz: (token) => [...attemptKeys.all, "quiz", token],
};
