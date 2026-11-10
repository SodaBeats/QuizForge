/* Attempt detail — full question-by-question breakdown of one attempt,
   rendered inline in place of the attempts list (it replaced the old
   detail modal). The body fetches the attempt's answers on mount
   (useAttemptDetail) and maps them to the view shape with mapAnswerRows;
   the header carries the student/score from the clicked list row plus the
   arrow button that returns to the list. Loading / error / empty bodies
   render in the panel's scrollable area, so the arrow stays reachable
   while the detail is in flight or fails. */

import { useEffect, useRef } from "react";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatSubmittedAt } from "../lib/format.js";
import { mapAnswerRows } from "../lib/attemptQuestions.js";
import { useAttemptDetail } from "../api/queries.js";

function BackIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5m0 0l6-6m-6 6l6 6"
      />
    </svg>
  );
}

const TYPE_LABELS = {
  "multiple-choice": "Multiple choice",
  "true-false": "True/False",
  "short-answer": "Short answer",
};

// T/F rows carry no options from the API — synthesized here (MCQ options
// come from the row; short-answer renders none).
const TF_OPTIONS = ["True", "False"];

function QuestionCard({ question }) {
  const isShort = question.type === "short-answer";
  const options =
    question.type === "true-false" ? TF_OPTIONS : question.options;
  const isSkipped = isShort
    ? question.chosenText == null
    : question.chosenIndex == null;
  const correct = isShort
    ? question.correctText
    : options[question.correctIndex];
  const answered = isShort
    ? (question.chosenText ?? "Skipped")
    : isSkipped
      ? "Skipped"
      : options[question.chosenIndex];
  const answeredTone = isSkipped
    ? "text-amber-300"
    : question.isCorrect
      ? "text-green-300"
      : "text-red-300";

  return (
    <article className="rounded-md bg-darkslate border border-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-inkondark">{question.text}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/15 border border-muted/20 text-muted">
            {TYPE_LABELS[question.type]}
          </span>
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
              question.isCorrect
                ? "bg-green-900/50 text-green-300"
                : "bg-red-900/50 text-red-300"
            }`}
          >
            {question.points}/{question.maxPoints}
          </span>
        </div>
      </div>

      {!isShort && (
        <ul className="mt-2 space-y-1">
          {options.map((option, i) => {
            const isCorrect = i === question.correctIndex;
            const isChosen = i === question.chosenIndex;
            const tone = isCorrect
              ? "text-green-300"
              : isChosen
                ? "text-red-300"
                : "text-muted";
            return (
              <li
                key={option}
                className={`flex items-center gap-2 text-xs ${tone}`}
              >
                {question.type === "multiple-choice" && (
                  <span className="w-4 shrink-0 font-medium">
                    {"ABCD"[i]}.
                  </span>
                )}
                <span>{option}</span>
                {isCorrect && <span aria-label="correct answer">✓</span>}
                {isChosen && !isCorrect && (
                  <span aria-label="student answer">✗</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 text-xs text-muted">
        Correct: <span className="text-green-300">{correct}</span>
      </p>

      <p className="mt-1 text-xs text-muted">
        Answered: <span className={answeredTone}>{answered}</span>
      </p>

      {question.remarks && (
        <p className="mt-1.5 text-xs text-muted">
          Remarks: <span className="text-inkondark">{question.remarks}</span>
        </p>
      )}
    </article>
  );
}

export function AttemptDetailView({
  attempt,
  student,
  quizId,
  attemptId,
  onBack,
}) {
  const backRef = useRef(null);
  const detailQuery = useAttemptDetail(quizId, attemptId);

  // Land keyboard focus on the arrow so the view can be left without a mouse.
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  let body;
  if (detailQuery.isPending) {
    body = (
      <div className="flex items-center justify-center py-10">
        <Spinner />
      </div>
    );
  } else if (detailQuery.isError) {
    body = (
      <div className="flex items-center justify-center py-10">
        <ErrorState
          message={
            detailQuery.error?.message ||
            "Something went wrong. Please try again."
          }
        />
      </div>
    );
  } else {
    const questions = mapAnswerRows(detailQuery.data);
    body =
      questions.length === 0 ? (
        <EmptyState message="No answers recorded for this attempt" />
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      );
  }

  return (
    <div
      role="region"
      aria-label="Attempt details"
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Header — score/date/student come from the clicked list row. */}
      <header className="shrink-0 flex items-start gap-3 p-3 sm:p-4 bg-specialsurface border-b border-muted/20">
        <button
          ref={backRef}
          type="button"
          onClick={onBack}
          aria-label="Back to attempts list"
          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-muted hover:text-inkondark hover:bg-muted/10 transition-colors"
        >
          <BackIcon />
        </button>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-inkondark truncate">
            {student.name}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {attempt.rawScore}/{attempt.maxPossibleScore} •{" "}
            {formatSubmittedAt(attempt.submittedAt)}
          </p>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">{body}</div>
    </div>
  );
}
