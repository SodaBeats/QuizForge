/* Deterministic per-question detail for one attempt (mock only).
   Everything is seeded by attempt.id + question index, so the same attempt
   always renders the same breakdown — stable across renders and testable.

   Question type comes from the index alone (never the attempt), so question
   N has the same type in every attempt of the exam — a real exam wouldn't
   reshuffle its question types per student. Pattern MCQ, MCQ, MCQ,
   true-false, short-answer → 60/20/20 (exam 1 = 15/5/5, exam 2 = 6/2/2).

   Invariants (covered by tests):
   - exactly `exam.questionCount` questions
   - multiple-choice: 4 options; true-false: exactly ["True", "False"];
     short-answer: no options, generated correctText/chosenText instead
   - exactly `rawScore` questions score 1 (per-question scores sum to the
     attempt's raw score) for every type; the rest score 0
   - wrong answers are occasionally "skipped" (chosenIndex/chosenText null)
     but still score 0
   - remarks are null (omitted) or a non-empty string */

const MCQ_OPTIONS = ["Option A", "Option B", "Option C", "Option D"];
const TF_OPTIONS = ["True", "False"];

const TYPE_PATTERN = [
  "multiple-choice",
  "multiple-choice",
  "multiple-choice",
  "true-false",
  "short-answer",
];

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
    const type = TYPE_PATTERN[i % TYPE_PATTERN.length];
    const isCorrect = correctSet.has(i);
    const score = isCorrect ? 1 : 0;
    // ~1 in 4 wrong answers was left blank; correct answers never are.
    const skipped = !isCorrect && pick(attempt.id, i, 2, 4) === 0;

    let remarks = null;
    if (isCorrect) {
      if (pick(attempt.id, i, 4, 6) === 0) {
        remarks = GOOD_REMARKS[pick(attempt.id, i, 5, GOOD_REMARKS.length)];
      }
    } else if (pick(attempt.id, i, 4, 3) === 0) {
      remarks = WRONG_REMARKS[pick(attempt.id, i, 5, WRONG_REMARKS.length)];
    }

    const base = {
      id: i + 1,
      type,
      text: `Question ${i + 1} of ${exam.title}`,
      score,
      remarks,
    };

    if (type === "short-answer") {
      const expected = `Expected answer for question ${i + 1}`;
      return {
        ...base,
        correctText: expected,
        chosenText: skipped
          ? null
          : isCorrect
            ? expected
            : `Submitted answer ${pick(attempt.id, i, 6, 3) + 1} for question ${i + 1}`,
      };
    }

    const options = type === "true-false" ? TF_OPTIONS : MCQ_OPTIONS;
    const correctIndex = pick(attempt.id, i, 1, options.length);
    const chosenIndex = skipped
      ? null
      : isCorrect
        ? correctIndex
        : options.length === 2 // true-false: the one wrong answer
          ? 1 - correctIndex
          : (correctIndex + 1 + pick(attempt.id, i, 3, 3)) % options.length;

    return { ...base, options, correctIndex, chosenIndex };
  });
}
