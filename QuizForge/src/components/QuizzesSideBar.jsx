// QuizzesSidebar.jsx
import { useNavigate } from "react-router-dom";
import "./LoadingScreen.css";

const primaryBtnClass =
  "w-full px-4 py-2.5 rounded-xl transition-all font-display font-bold text-sm text-[#3a2010] hover:-translate-y-0.5 active:translate-y-0.5";
const primaryBtnStyle = {
  background: "linear-gradient(155deg, #ffab6b, #ff9450 55%, #e8752a)",
  boxShadow:
    "inset 2px 2px 4px rgba(255,255,255,0.4), inset -3px -3px 6px rgba(80,30,5,0.4), 6px 6px 14px rgba(0,0,0,0.4)",
};

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
      <div className="w-full lg:w-64 flex flex-col bg-[#26211c] p-3">
        <div className="flex-1 rounded-2xl bg-[#322b23] flex items-center justify-center shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full lg:w-64 flex flex-col bg-[#26211c] font-body p-3 gap-3">
        <div className="flex-1 rounded-2xl bg-[#322b23] flex items-center justify-center text-[#6b5f52] text-sm shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          Failed to fetch quizzes
        </div>
        {/* Create New Quiz Button */}
        <div className="rounded-2xl bg-[#322b23] p-4 shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          <button
            onClick={() =>
              navigate("/teacher", { state: { openForgeQuizModal: true } })
            }
            className={primaryBtnClass}
            style={primaryBtnStyle}
          >
            + Create new quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-64 flex flex-col bg-[#26211c] font-body p-3 gap-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="flex-1 flex flex-col rounded-2xl bg-[#322b23] overflow-hidden shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
        {/* Header */}
        <div className="p-4 bg-[#3a3128]">
          <h2 className="text-sm font-display font-semibold text-[#e8ddce]">
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
                  className={`p-3 rounded-xl text-sm flex items-center justify-between group cursor-pointer transition-all ${
                    selectedQuizId === quiz.id
                      ? "bg-gradient-to-br from-[#ffab6b] via-[#ff9450] to-[#e8752a] text-[#3a2010] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(80,30,5,0.3),4px_4px_10px_rgba(0,0,0,0.35)]"
                      : "bg-[#26211c] hover:bg-[#3a3128] text-[#cabaa2] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)]"
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
                          ? "text-[#5c3512]"
                          : "text-[#766a59]"
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
                        ? "text-[#3a2010] hover:text-black"
                        : "text-red-400 hover:text-red-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="text-[#6b5f52] text-sm text-center py-8">
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
            className={primaryBtnClass}
            style={primaryBtnStyle}
          >
            + Create new quiz
          </button>
        </div>
      </div>
    </div>
  );
}
