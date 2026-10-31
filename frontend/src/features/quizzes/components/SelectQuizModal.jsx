// src/features/quizzes/components/SelectQuizModal.jsx
import { usePagedQuizzes } from "../api/queries.js";
import { Modal } from "../../../components/ui/Modal";

// ------------------------------------------------------------------------------------
// SUB COMPONENT: Select Quiz Modal
// -------------------------------------------------------------------------------------
export function SelectQuizModal({
  page,
  closeSelectQuizModal,
  handleSelectQuiz,
  fetchPreviousQuizzes,
  fetchMoreQuizzes,
}) {
  const { data, isFetching, error } = usePagedQuizzes(page);

  const totalQuizzes = data?.totalQuizzes || 0;

  if (isFetching) {
    return (
      <Modal
        onClose={closeSelectQuizModal}
        panelClassName="bg-canvas rounded-lg p-6 w-96 border border-muted font-body"
      >
        <div className="flex flex-col items-center gap-3 text-inkondark">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <span>Loading quizzes...</span>
        </div>
      </Modal>
    );
  }

  if (error) {
    console.error(error);
    return (
      <Modal
        onClose={closeSelectQuizModal}
        backdropClassName="bg-canvas/70"
        panelClassName="bg-specialsurface rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-muted font-body"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-inkondark">
            Error
          </h2>
          <button
            onClick={closeSelectQuizModal}
            className="text-red-500 hover:text-red-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 text-red-400 text-sm">
          <p>Something went wrong while fetching quizzes</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={closeSelectQuizModal}
      panelClassName="bg-specialsurface rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-muted font-body"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-display font-semibold text-inkondark">
          Select a quiz
        </h2>
        <button
          onClick={closeSelectQuizModal}
          className="text-red-500 hover:text-red-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-2">
        {data?.userQuizzes?.length > 0 ? (
          data.userQuizzes.map((quiz) => (
            <button
              key={quiz.id}
              onClick={() => handleSelectQuiz(quiz)}
              className="w-full text-left p-3 rounded-lg transition-all text-sm hover:bg-mutedteal text-inkondark border border-muted/20"
            >
              <div className="font-medium truncate">{quiz.quizTitle}</div>
              <div className="text-xs text-muted mt-1">
                Token: {quiz.shareToken}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center text-muted py-6 text-sm">
            No quizzes available
          </div>
        )}
      </div>
      {/* pagination controls */}
      {totalQuizzes > 5 && (
        <div className="flex items-center justify-center gap-4 mb-4 mt-2 pt-4">
          <button
            onClick={fetchPreviousQuizzes}
            disabled={page === 0}
            className="px-3 py-2 rounded-md text-inkondark transition-all text-sm bg-surface hover:bg-muted/20 border border-muted/20 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous page"
          >
            ← Prev
          </button>
          <span className="text-muted text-sm">Page {page + 1}</span>
          <button
            onClick={fetchMoreQuizzes}
            disabled={
              page * 5 + (data?.userQuizzes?.length || 0) >= totalQuizzes
            }
            className="px-3 py-2 rounded-md text-inkondark transition-all text-sm bg-surface hover:bg-muted/20 border border-muted/20 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </Modal>
  );
}
