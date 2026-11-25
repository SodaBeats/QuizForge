// QuizzesList.jsx — renamed from QuizzesSideBar: it sits inside the main
// content area beside the section nav now, so "list" is what it is.
import { useNavigate } from "react-router-dom";
import { Spinner } from "../../../components/ui/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState";

// Must match listPaged's hardcoded limit/offset math in quizzes.api.js
// (components may not import that file — see queries.js header).
const PAGE_SIZE = 5;

export function QuizzesList({
  isFetching,
  quizzes,
  setSelectedQuizId,
  selectedQuizId,
  onDeleteQuiz,
  isError,
  page = 0,
  totalQuizzes = 0,
  onPrevPage,
  onNextPage,
}) {
  const navigate = useNavigate();

  if (isFetching) {
    return (
      <div className="w-full lg:w-64 min-w-0 flex flex-col bg-specialsurface p-3">
        <div className="flex-1 rounded-lg flex items-center justify-center border border-muted/20">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full lg:w-64 min-w-0 flex flex-col bg-specialsurface font-body ml-0 p-3 gap-3">
        <div className="flex-1 rounded-lg flex items-center justify-center text-red-400 text-sm border border-muted/20">
          Failed to fetch examinations
        </div>
        {/* Create New Quiz Button */}
        <div className="rounded-lg p-4 border border-muted/20">
          <button
            onClick={() =>
              navigate("/teacher/exam-workstation", {
                state: { openForgeQuizModal: true },
              })
            }
            className="btn-primary w-full py-2.5 transition-all text-sm hover:bg-green-600 hover:-translate-y-0.5 active:translate-y-0.5"
          >
            + Create new examination
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-64 min-w-0 flex flex-col font-body ml-0 p-3 gap-3">
      <div className="flex-1 flex flex-col rounded-lg bg-specialsurface border border-muted/20 lg:overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-muted/20">
          <h2 className="text-sm font-display font-semibold text-inkondark">
            Examinations
          </h2>
        </div>

        {/* Quiz List */}
        <div className="flex-1 p-4 lg:overflow-y-auto">
          <div className="space-y-2">
            {quizzes?.length > 0 ? (
              quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`p-3 rounded-md text-sm flex items-center justify-between group cursor-pointer transition-all ${
                    selectedQuizId === quiz.id
                      ? "bg-accent text-inkondark"
                      : "hover:bg-muted/20 text-inkondark border border-muted/20"
                  }`}
                  onClick={() => {
                    const newId = selectedQuizId === quiz.id ? null : quiz.id;
                    setSelectedQuizId(newId);
                  }}
                >
                  <div className="flex-1 truncate">
                    <div className="font-medium truncate">{quiz.quizTitle}</div>
                    <div
                      className={`text-xs mt-1 ${
                        selectedQuizId === quiz.id
                          ? "text-inkondark"
                          : "text-muted"
                      }`}
                    >
                      {quiz.questionCount || 0} questions
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteQuiz(quiz.id);
                    }}
                    className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                      selectedQuizId === quiz.id
                        ? "text-inkondark hover:text-red-500"
                        : "text-red-400 hover:text-red-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <EmptyState message="No quizzes yet" className="text-sm py-8" />
            )}
          </div>
        </div>

        {/* Pagination — hidden while everything fits on one page, but always
            reachable from page > 0 so deleting the last item can't strand
            you on an empty later page. */}
        {page > 0 || totalQuizzes > PAGE_SIZE ? (
          <div className="flex items-center justify-center gap-3 px-4 pb-3">
            <button
              onClick={onPrevPage}
              disabled={page === 0}
              className="px-3 py-2 rounded-md text-inkondark transition-all text-sm bg-surface hover:bg-muted/20 border border-muted/20 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous page"
            >
              ← Prev
            </button>
            <span className="text-muted text-sm">Page {page + 1}</span>
            <button
              onClick={onNextPage}
              disabled={
                page * PAGE_SIZE + (quizzes?.length || 0) >= totalQuizzes
              }
              className="px-3 py-2 rounded-md text-inkondark transition-all text-sm bg-surface hover:bg-muted/20 border border-muted/20 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next page"
            >
              Next →
            </button>
          </div>
        ) : null}

        {/* Create New Quiz Button */}
        <div className="p-4">
          <button
            onClick={() =>
              navigate("/teacher/exam-workstation", {
                state: { openForgeQuizModal: true },
              })
            }
            className="btn-primary w-full py-2.5 transition-all text-sm hover:bg-green-600 hover:-translate-y-0.5 active:translate-y-0.5"
          >
            + Create new quiz
          </button>
        </div>
      </div>
    </div>
  );
}
