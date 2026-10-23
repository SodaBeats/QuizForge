// QuizzesSidebar.jsx
import { useNavigate } from "react-router-dom";
import "../LoadingScreen.css";

export default function QuizzesSidebar({
  isFetching,
  quizzes,
  setSelectedQuizId,
  selectedQuizId,
  onDeleteQuiz,
  isError,
}) {
  const navigate = useNavigate();

  if (isFetching) {
    return (
      <div className="w-full lg:w-64 min-w-0 flex flex-col bg-specialsurface border-r-2 border-accent/50 p-3">
        <div className="flex-1 rounded-lg flex items-center justify-center border border-muted/20">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full lg:w-64 min-w-0 flex flex-col bg-specialsurface border-r-2 border-accent/50 font-body p-3 gap-3">
        <div className="flex-1 rounded-lg flex items-center justify-center text-red-400 text-sm border border-muted/20">
          Failed to fetch quizzes
        </div>
        {/* Create New Quiz Button */}
        <div className="rounded-lg p-4 border border-muted/20">
          <button
            onClick={() =>
              navigate("/teacher", { state: { openForgeQuizModal: true } })
            }
            className="btn-primary w-full py-2.5 transition-all text-sm hover:bg-green-600 hover:-translate-y-0.5 active:translate-y-0.5"
          >
            + Create new quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-64 min-w-0 flex flex-col bg-specialsurface border-r-2 border-accent/50 font-body p-3 gap-3">
      <div className="flex-1 flex flex-col rounded-lg overflow-hidden border border-muted/20">
        {/* Header */}
        <div className="p-4 border-b border-muted/20">
          <h2 className="text-sm font-display font-semibold text-inkondark">
            Quizzes
          </h2>
        </div>

        {/* Quiz List */}
        <div className="flex-1 p-4 overflow-y-auto">
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
              <div className="text-muted text-sm text-center py-8">
                No quizzes yet
              </div>
            )}
          </div>
        </div>

        {/* Create New Quiz Button */}
        <div className="p-4">
          <button
            onClick={() =>
              navigate("/teacher", { state: { openForgeQuizModal: true } })
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
