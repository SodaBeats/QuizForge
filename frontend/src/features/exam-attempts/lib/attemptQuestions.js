/* Pure mapper: API answer rows → the detail view's per-question view shape.
   This is where letter→index mapping lives (Vitest-covered).

   Storage contract (server-side, lowercase):
   - multiple-choice: single letters 'a'..'d' (chosen + correct are the
     submit-time snapshot from attempt_answers_db)
   - true-false: 'true' / 'false' strings
   - short-answer: free text (chosen null = skipped)
   The view displays letters capitalized ("A."/"True") — frontend only. */

const MCQ_LETTERS = "abcd";

/** 'a'..'d' → 0..3; null (skipped) and unexpected values → null. */
function letterIndex(answer) {
  if (answer == null) return null;
  const index = MCQ_LETTERS.indexOf(answer);
  return index === -1 ? null : index;
}

/** 'true' → 0, 'false' → 1; null (skipped) → null. */
function boolIndex(answer) {
  if (answer == null) return null;
  return answer === "true" ? 0 : 1;
}

/**
 * Convert normalized answer rows (GET /:quizId/attempts/:attemptId) into
 * the shape AttemptDetailView's QuestionCard renders.
 *
 * @param {Array<object>} rows API rows: questionId, questionText,
 *   questionType, options[], chosenAnswer, correctAnswer, isCorrect,
 *   points, maxPoints, remarks
 * @returns {Array<object>} view rows: id, type, text, options (MCQ array,
 *   null otherwise — the view synthesizes T/F's ["True","False"]),
 *   correctIndex/chosenIndex (MCQ/T-F, null when skipped or unexpected),
 *   correctText/chosenText (short-answer only), points, maxPoints,
 *   isCorrect, remarks
 */
export function mapAnswerRows(rows) {
  return rows.map((row) => {
    const base = {
      id: row.questionId,
      type: row.questionType,
      text: row.questionText,
      points: row.points,
      maxPoints: row.maxPoints,
      isCorrect: row.isCorrect,
      remarks: row.remarks,
    };

    if (row.questionType === "short-answer") {
      return {
        ...base,
        options: null,
        correctIndex: null,
        chosenIndex: null,
        correctText: row.correctAnswer,
        chosenText: row.chosenAnswer,
      };
    }

    if (row.questionType === "true-false") {
      return {
        ...base,
        options: null, // modal synthesizes ["True", "False"]
        correctIndex: boolIndex(row.correctAnswer),
        chosenIndex: boolIndex(row.chosenAnswer),
        correctText: null,
        chosenText: null,
      };
    }

    return {
      ...base,
      options: row.options ?? [],
      correctIndex: letterIndex(row.correctAnswer),
      chosenIndex: letterIndex(row.chosenAnswer),
      correctText: null,
      chosenText: null,
    };
  });
}
