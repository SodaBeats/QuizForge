/* Attempt detail modal — full question-by-question breakdown of one
   attempt, fetched on open (useAttemptDetail) and mapped to the view
   shape by mapAnswerRows. Uses the shared Modal primitive (portal,
   Escape, focus trap): the panel is a fixed header over a scrollable
   body, so long attempts scroll under the header and close button —
   close works during loading and error alike. */

import { Modal } from "../../../components/ui/Modal";
import { Spinner } from "../../../components/ui/Spinner";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatSubmittedAt } from "../lib/format.js";
import { mapAnswerRows } from "../lib/attemptQuestions.js";
import { useAttemptDetail } from "../api/queries.js";

function CloseIcon() {
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
        d="M6 18L18 6M6 6l12 12"
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
        <span className="mx-2">•</span>
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

export function AttemptDetailModal({
  attempt,
  student,
  quizId,
  attemptId,
  onClose,
}) {
  const detailQuery = useAttemptDetail(quizId, attemptId);

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
    <Modal
      onClose={onClose}
      panelClassName="bg-specialsurface rounded-lg border border-muted w-[640px] max-w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col overflow-hidden font-body"
    >
      {/* Fixed header — score/date/student come from the clicked list row. */}
      <header className="shrink-0 flex items-start justify-between gap-4 px-5 py-4 border-b border-muted/20">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-inkondark truncate">
            {student.name}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {attempt.rawScore}/{attempt.maxPossibleScore} •{" "}
            {formatSubmittedAt(attempt.submittedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close attempt details"
          className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-muted hover:text-inkondark hover:bg-muted/10 transition-colors"
        >
          <CloseIcon />
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{body}</div>
    </Modal>
  );
}
