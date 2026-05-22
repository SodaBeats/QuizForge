import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingScreen from "./LoadingScreen";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

// ------------------------------------------------------------------------------------
// SUB COMPONENT
// -------------------------------------------------------------------------------------
function SelectQuizModal({
  page,
  fetchQuizzes,
  closeSelectQuizModal,
  handleSelectQuiz,
  fetchPreviousQuizzes,
  fetchMoreQuizzes,
}) {
  const { data, isFetching, error } = useQuery({
    queryKey: ["userQuizzes", page],
    queryFn: () => fetchQuizzes(page),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
  });

  const totalQuizzes = data?.totalQuizzes || 0;

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Select a Quiz</h2>
            <button
              onClick={closeSelectQuizModal}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="text-center text-gray-400 py-6">
            <LoadingScreen />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    {
      console.error(error);
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Error</h2>
            <button
              onClick={closeSelectQuizModal}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            <p>Something went wrong while fetching quizzes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Select a Quiz</h2>
          <button
            onClick={closeSelectQuizModal}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {data.userQuizzes.length > 0 ? (
            data.userQuizzes.map((quiz) => (
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
        {/* pagination controls */}
        {totalQuizzes > 5 && (
          <div className="flex items-center justify-center gap-4 mb-4 border-t border-gray-700 pt-4">
            <button
              onClick={fetchPreviousQuizzes}
              disabled={page === 0}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded border border-gray-600 transition-colors"
              title="Previous page"
            >
              ← Prev
            </button>
            <span className="text-gray-400 text-sm">Page {page + 1}</span>
            <button
              onClick={fetchMoreQuizzes}
              disabled={
                page * 5 + (data?.userQuizzes?.length || 0) >= totalQuizzes
              }
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded border border-gray-600 transition-colors"
              title="Next page"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  isFetching,
}) {
  const { authFetch } = useContext(AuthContext);
  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const openSelectQuizModal = async () => {
    setIsSelectQuizModalOpen(true);
  };

  const fetchMoreQuizzes = () => {
    setPage(page + 1);
  };

  const fetchPreviousQuizzes = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleFileDelete = async (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }
  };

  const handleQuestionDelete = async (questionId) => {
    //store question list as backup
    //const previousQuestions = [...questions];
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

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Failed to delete question: ${result.message}`);
      }

      toast.success(result.message);
    } catch (error) {
      console.error(error.message, error.status);
      setQuestions(previousQuestions);
      setSelectedQuestionId(previousSelectedQuestionId);
      alert("Something went wrong with the question deletion.");
    }
  };

  const closeSelectQuizModal = () => {
    setIsSelectQuizModalOpen(false);
  };

  const fetchQuizzes = async (page = 0) => {
    const offset = page * 5;
    const limit = 5;
    const response = await authFetch(
      `${backendHost}/api/quizzes?limit=${limit}&offset=${offset}`,
      {
        credentials: "include",
      },
    );
    if (!response.ok) {
      throw new Error("Failed to fetch quizzes");
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(`Failed to fetch quizzes: ${result.message}`);
    }
    return result;
  };

  const handleSelectQuiz = async (quiz) => {
    setCurrentQuiz(quiz);
    closeSelectQuizModal();
    /*try {
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
    }*/
  };

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  // ------------------------------------------------------------------------------------
  // MAIN COMPONENT
  //-------------------------------------------------------------------------------------

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
              className="text-xs text-blue-400 hover:text-blue-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select a quiz
            </button>
          )}
        </div>

        {/* Question List - 70% */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-row items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-400">Questions</div>
          </div>
          <div className="space-y-1">
            {questions ? (
              questions.map((question) => (
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
            ) : isFetching ? (
              <div className="space-y-1">
                <div className="text-gray-500 text-sm">Fetching...</div>
              </div>
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
        <SelectQuizModal
          page={page}
          fetchQuizzes={fetchQuizzes}
          closeSelectQuizModal={closeSelectQuizModal}
          handleSelectQuiz={handleSelectQuiz}
          fetchPreviousQuizzes={fetchPreviousQuizzes}
          fetchMoreQuizzes={fetchMoreQuizzes}
        />
      )}
    </>
  );
}
export default SideBar;
