/* Pure helpers for the Exam Attempts page — the high-risk logic lives here
   so it stays testable without rendering. */

/** Attempts for one student, newest submission first. */
export function sortAttemptsNewestFirst(attempts) {
  return [...attempts].sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
}

/** Student groups A→Z by name (case-insensitive, locale-aware). */
export function sortStudents(groups) {
  return [...groups].sort((a, b) =>
    a.student.name.localeCompare(b.student.name, undefined, { sensitivity: "base" }),
  );
}

/** [{ student, attempts }] for every student with ≥1 attempt, students
    A→Z, each student's attempts newest first. Attempts referencing an
    unknown student are dropped. */
export function groupAttemptsByStudent(attempts, students) {
  const byId = new Map(students.map((student) => [student.id, student]));
  const groups = new Map();

  for (const attempt of attempts) {
    const student = byId.get(attempt.studentId);
    if (!student) continue;
    const group = groups.get(student.id) ?? { student, attempts: [] };
    group.attempts.push(attempt);
    groups.set(student.id, group);
  }

  return sortStudents(
    [...groups.values()].map((group) => ({
      ...group,
      attempts: sortAttemptsNewestFirst(group.attempts),
    })),
  );
}

/** Case-insensitive substring match on student name; blank query keeps all. */
export function filterBySearch(groups, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;
  return groups.filter((group) =>
    group.student.name.toLowerCase().includes(needle),
  );
}

/** Groups whose student belongs to the given class. A student in several
    classes with access appears under every matching tab (each tab filters
    independently). */
export function filterByClass(groups, classId) {
  return groups.filter((group) => group.student.classIds.includes(classId));
}
