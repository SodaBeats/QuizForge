import { useContext, useState } from "react";
import { AuthContext } from "./AuthProvider";
import toast from "react-hot-toast";

function SideBar({
  uploadedFiles,
  setUploadedFiles,
  selectedFileId,
  setSelectedFileId,
  selectedQuestionId,
  setSelectedQuestionId,
  questions,
  setQuestions,
  currentQuiz,
  setCurrentQuiz,
}) {
  const { authFetch } = useContext(AuthContext);
  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);

  const backendHost = import.meta.env.VITE_BACKEND_HOST;
  if (!backendHost) throw new Error("Missing backend host");

  const handleFileDelete = async (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }
  };

  const handleQuestionDelete = async (questionId) => {
    //store question list as backup
    const previousQuestions = [...questions];
    //store selected question as backup
    const previousSelectedQuestionId = selectedQuestionId;

    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    if (questionId === selectedQuestionId) {
      setSelectedQuestionId(null);
    }
    try {
      const response = await authFetch(
        `${backendHost}/api/questions/${questionId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Server responded with: Error ${response.status}: ${response.statusText}`,
        );
      }

      const deletedQuestion = await response.json();

      if (!deletedQuestion.success) {
        throw new Error(
          `Failed to delete question: ${deletedQuestion.message}`,
        );
      }

      toast.success(deletedQuestion.message);
    } catch (error) {
      console.error(error.message, error.status);
      setQuestions(previousQuestions);
      setSelectedQuestionId(previousSelectedQuestionId);
      alert("Something went wrong with the question deletion.");
    }
  };

  const openSelectQuizModal = async () => {
    setIsLoadingQuizzes(true);
    try {
      const response = await authFetch(`${backendHost}/api/quizzes`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(
          `Quiz Selection Error ${response.status}: ${response.statusText}`,
        );
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAvailableQuizzes(data);
      } else if (data.quizzes && Array.isArray(data.quizzes)) {
        setAvailableQuizzes(data.quizzes);
      } else {
        setAvailableQuizzes([]);
      }
      setIsSelectQuizModalOpen(true);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to fetch quizzes");
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  const closeSelectQuizModal = () => {
    setIsSelectQuizModalOpen(false);
  };

  const handleSelectQuiz = async (quiz) => {
    setCurrentQuiz(quiz);
    closeSelectQuizModal();
    try {
      const response = await authFetch(
        `${backendHost}/api/quizzes/questions?quizId=${quiz.id}`,
        {
          credentials: "include",
        },
      );
      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setQuestions(result.questionList);
    } catch (error) {
      console.error(error);
      toast.error(`something went wrong while fetching questions`);
    }
  };

  return (
    <>
      <div className="w-48 border-r border-gray-700 flex flex-col">
        {/* File List - 30% */}
        <div className="h-[30%] border-b border-gray-700 p-4 overflow-y-auto">
          <div className="text-sm font-semibold text-gray-400 mb-3">Files</div>
          <div className="space-y-1">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`py-1 px-2 rounded text-sm flex items-center justify-between group ${
                    selectedFileId === file.id
                      ? "bg-blue-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <div
                    className="cursor-pointer truncate flex-1"
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    {file.name}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileDelete(file.id);
                      // TODO: Implement delete file logic
                    }}
                    className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No file uploaded</div>
            )}
          </div>
        </div>

        {/* Current Quiz - Small Section */}
        <div className="border-b border-gray-700 p-3 bg-blue-900 bg-opacity-40">
          <div className="text-sm font-semibold text-gray-400 mb-3">
            Current Quiz
          </div>
          {currentQuiz ? (
            <div className="flex items-center justify-between w-full bg-blue-700 px-3 py-2 group">
              <span className="text-sm text-white truncate flex-1">
                {currentQuiz.quizTitle}
              </span>
              <button
                onClick={() => {
                  setCurrentQuiz(null);
                  setQuestions([]);
                }}
                className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={openSelectQuizModal}
              disabled={isLoadingQuizzes}
              className="text-xs text-blue-400 hover:text-blue-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingQuizzes ? "Loading..." : "Select a quiz"}
            </button>
          )}
        </div>

        {/* Question List - 70% */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-row items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-400">Questions</div>
          </div>
          <div className="space-y-1">
            {currentQuiz ? (
              questions?.map((question) => (
                <div
                  key={question.id}
                  className={`py-1 px-2 rounded text-sm flex items-center justify-between group ${
                    selectedQuestionId === question.id
                      ? "bg-blue-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <div
                    className="cursor-pointer truncate flex-1"
                    onClick={() => setSelectedQuestionId(question.id)}
                  >
                    {question.questionText || question.question_text}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuestionDelete(question.id);
                    }}
                    className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="space-y-1">
                <div className="text-gray-500 text-sm">No Questions</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Select Quiz Modal */}
      {isSelectQuizModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Select a Quiz
            </h2>

            <div className="space-y-2">
              {availableQuizzes.length > 0 ? (
                availableQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => handleSelectQuiz(quiz)}
                    className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white text-sm"
                  >
                    <div className="font-medium truncate">{quiz.quizTitle}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Token: {quiz.shareToken}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-400 py-6">
                  No quizzes available
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={closeSelectQuizModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default SideBar;
