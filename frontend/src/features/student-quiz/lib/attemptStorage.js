// Centralized sessionStorage access for in-progress student attempts
// (Phase 4, fixes F20). StudentQuizPage and StudentTimeLimit used to build
// ad-hoc keys and parse JSON inline — including a cleanup loop that scanned
// every sessionStorage key. Exit criterion: no direct sessionStorage access
// anywhere else in src/.
//
// Namespaced key scheme (old `quiz_progress_*` / `quiz_timer_*` keys from
// tabs opened before this change are intentionally orphaned — sessionStorage
// is per-tab and short-lived):
//   progress: sf:attempt:progress:${quizToken}
//   timer:    sf:attempt:timer:${attemptId}:${questionId}

const PROGRESS_PREFIX = "sf:attempt:progress:";
const TIMER_PREFIX = "sf:attempt:timer:";

export function progressKey(quizToken) {
  return `${PROGRESS_PREFIX}${quizToken}`;
}

export function timerKey(attemptId, questionId) {
  return `${TIMER_PREFIX}${attemptId}:${questionId}`;
}

function emptyProgress() {
  return {
    answers: {},
    selectedQuestionIndex: 0,
    answeredQuestions: new Set(),
  };
}

// Single read + parse of this attempt's saved progress. Corrupt or
// invalid payloads are dropped (key removed) and treated as empty instead
// of crashing the page during render.
export function loadProgress(quizToken) {
  const key = progressKey(quizToken);
  const saved = sessionStorage.getItem(key);
  if (!saved) return emptyProgress();

  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") {
      sessionStorage.removeItem(key);
      return emptyProgress();
    }
    return {
      answers: parsed.answers ?? {},
      selectedQuestionIndex: parsed.selectedQuestionIndex ?? 0,
      // sessionStorage can't store a Set — stored as an array, read back as a Set
      answeredQuestions: new Set(parsed.answeredQuestions ?? []),
    };
  } catch {
    sessionStorage.removeItem(key);
    return emptyProgress();
  }
}

export function saveProgress(
  quizToken,
  { answers, selectedQuestionIndex, answeredQuestions },
) {
  sessionStorage.setItem(
    progressKey(quizToken),
    JSON.stringify({
      answers,
      selectedQuestionIndex,
      // Convert Set to array for serialization
      answeredQuestions: [...answeredQuestions],
    }),
  );
}

// Removes everything this attempt owns — progress plus every per-question
// timer key, deleted directly via questionIds. No iteration over storage.
export function clearAttempt({ quizToken, attemptId, questionIds = [] }) {
  sessionStorage.removeItem(progressKey(quizToken));
  if (!attemptId) return;

  for (const questionId of questionIds) {
    sessionStorage.removeItem(timerKey(attemptId, questionId));
  }
}

// Validated get-or-create for a question's timer start (logic moved verbatim
// from StudentTimeLimit): reject NaN/non-positive/future/stale values and
// write a fresh start time when invalid.
export function getTimerStart({ attemptId, questionId, timeLimit }) {
  if (!attemptId || !questionId) return Date.now();

  const key = timerKey(attemptId, questionId);
  try {
    const savedValue = sessionStorage.getItem(key);
    const parsedValue = Number(savedValue);
    const now = Date.now();
    const maxReasonableAge = timeLimit * 2 * 1000;

    if (
      !savedValue ||
      Number.isNaN(parsedValue) ||
      parsedValue <= 0 ||
      parsedValue > now ||
      now - parsedValue > maxReasonableAge
    ) {
      sessionStorage.setItem(key, String(now));
      return now;
    }

    return parsedValue;
  } catch (err) {
    console.error(
      "Session Storage access failed, using current time instead: ",
      err,
    );
    return Date.now();
  }
}
