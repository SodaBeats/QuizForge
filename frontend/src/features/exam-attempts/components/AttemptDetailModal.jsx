/* Attempt detail modal — full question-by-question breakdown of one
   attempt. Uses the shared Modal primitive (portal, Escape, focus trap):
   the panel is a fixed header over a scrollable body, so long attempts
   (25 questions) scroll under the header and close button. */

import { Modal } from "../../../components/ui/Modal";
import { formatSubmittedAt } from "../lib/format.js";
import { buildAttemptDetail } from "../lib/questionDetail.js";

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

function QuestionCard({ question }) {
  const correct = question.options[question.correctIndex];
  const answered =
    question.chosenIndex == null
      ? "Skipped"
      : question.options[question.chosenIndex];

  return (
    <article className="rounded-md bg-darkslate border border-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-inkondark">{question.text}</p>
        <span
          className={`shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
            question.score === 1
              ? "bg-green-900/50 text-green-300"
              : "bg-red-900/50 text-red-300"
          }`}
        >
          {question.score}/1
        </span>
      </div>

      <ul className="mt-2 space-y-1">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isChosen = i === question.chosenIndex;
          const tone = isCorrect
            ? "text-green-300"
            : isChosen
              ? "text-red-300"
              : "text-muted";
          return (
            <li key={option} className={`flex items-center gap-2 text-xs ${tone}`}>
              <span className="w-4 shrink-0 font-medium">
                {"ABCD"[i]}.
              </span>
              <span>{option}</span>
              {isCorrect && <span aria-label="correct answer">✓</span>}
              {isChosen && !isCorrect && (
                <span aria-label="student answer">✗</span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-xs text-muted">
        Correct: <span className="text-green-300">{correct}</span>
        <span className="mx-2">•</span>
        Answered:{" "}
        <span
          className={
            question.chosenIndex == null ? "text-amber-300" : "text-red-300"
          }
        >
          {answered}
        </span>
      </p>

      {question.remarks && (
        <p className="mt-1.5 text-xs text-muted">
          Remarks: <span className="text-inkondark">{question.remarks}</span>
        </p>
      )}
    </article>
  );
}

export function AttemptDetailModal({ attempt, student, exam, onClose }) {
  const questions = buildAttemptDetail(attempt, exam);

  return (
    <Modal
      onClose={onClose}
      panelClassName="bg-specialsurface rounded-lg border border-muted w-[640px] max-w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col overflow-hidden font-body"
    >
      {/* Fixed header */}
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
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    </Modal>
  );
}
