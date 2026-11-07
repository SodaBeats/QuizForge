/* Deterministic per-question detail for one attempt (mock only).
   Everything is seeded by attempt.id + question index, so the same attempt
   always renders the same breakdown — stable across renders and testable.

   Invariants (covered by tests):
   - exactly `exam.questionCount` questions, 4 options each
   - exactly `rawScore` questions score 1 (per-question scores sum to the
     attempt's raw score); the rest score 0
   - wrong answers are occasionally "skipped" (chosenIndex null) but still
     score 0
   - remarks are null (omitted) or a non-empty string */

const OPTIONS = ["Option A", "Option B", "Option C", "Option D"];

const WRONG_REMARKS = [
  "Review this topic before the next attempt.",
  "Re-check the worked example from class.",
  "Common mistake — read the question carefully.",
];
const GOOD_REMARKS = ["Clean answer.", "Good recall."];

/** 32-bit avalanche hash of (attemptId, questionIndex) → unsigned int. */
function hash(seedA, seedB) {
  let h = (seedA * 374761393 + seedB * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Deterministic value in [0, n). */
function pick(attemptId, questionIndex, salt, n) {
  return hash(attemptId * 1000 + questionIndex * 7 + salt, salt) % n;
}

/**
 * Question-by-question breakdown for one attempt of one exam.
 * @param {{ id: number, rawScore: number }} attempt
 * @param {{ title: string, questionCount: number }} exam
 */
export function buildAttemptDetail(attempt, exam) {
  const count = exam.questionCount;
  const correctCount = Math.min(Math.max(attempt.rawScore, 0), count);

  // Deterministic permutation of question indices: the first `correctCount`
  // positions are the questions the student got right. Sorting by hash is
  // stable, so equal hashes keep index order — still deterministic.
  const order = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => hash(attempt.id, a) - hash(attempt.id, b),
  );
  const correctSet = new Set(order.slice(0, correctCount));

  return Array.from({ length: count }, (_, i) => {
    const correctIndex = pick(attempt.id, i, 1, OPTIONS.length);
    const isCorrect = correctSet.has(i);

    let chosenIndex = correctIndex;
    let score = 1;
    if (!isCorrect) {
      score = 0;
      // ~1 in 4 wrong answers was left blank; otherwise pick a wrong option.
      chosenIndex =
        pick(attempt.id, i, 2, 4) === 0
          ? null
          : (correctIndex + 1 + pick(attempt.id, i, 3, 3)) % OPTIONS.length;
    }

    let remarks = null;
    if (isCorrect) {
      if (pick(attempt.id, i, 4, 6) === 0) {
        remarks = GOOD_REMARKS[pick(attempt.id, i, 5, GOOD_REMARKS.length)];
      }
    } else if (pick(attempt.id, i, 4, 3) === 0) {
      remarks = WRONG_REMARKS[pick(attempt.id, i, 5, WRONG_REMARKS.length)];
    }

    return {
      id: i + 1,
      text: `Question ${i + 1} of ${exam.title}`,
      options: OPTIONS,
      correctIndex,
      chosenIndex,
      score,
      remarks,
    };
  });
}
