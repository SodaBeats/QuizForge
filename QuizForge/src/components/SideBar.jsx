import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { documentServices } from "../services/documentServices";
const backendHost = import.meta.env.VITE_BACKEND_HOST;

// shared clay styling tokens — cosmetic only, referenced by className below
const primaryBtnClass =
  "font-display font-bold rounded-xl px-4 py-2 text-[#3a2010] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0.5";
const primaryBtnStyle = {
  background: "linear-gradient(155deg, #ffab6b, #ff9450 55%, #e8752a)",
  boxShadow:
    "inset 2px 2px 4px rgba(255,255,255,0.4), inset -3px -3px 6px rgba(80,30,5,0.4), 5px 5px 12px rgba(0,0,0,0.4)",
};
const secondaryBtnClass =
  "rounded-xl px-4 py-2 transition-all text-[#cabaa2] bg-[#26211c] hover:bg-[#3a3128] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-3px_-3px_7px_rgba(255,255,255,0.04)]";
const modalPanelClass =
  "bg-[#322b23] rounded-3xl shadow-[10px_10px_22px_rgba(0,0,0,0.5),-6px_-6px_16px_rgba(255,255,255,0.04)] font-body";

// ------------------------------------------------------------------------------------
// SUB COMPONENTS
// -------------------------------------------------------------------------------------
function FileModal({
  closeFileModal,
  handleSelectDocument,
  fetchMoreDocuments,
  fetchPreviousDocuments,
  isUploading,
  selectedFileId,
  page,
  authFetch,
}) {
  const { data, isFetching, error } = useQuery({
    queryKey: ["docFetch", page],
    queryFn: () => documentServices.fetchDocs(authFetch, page),
    staleTime: 1000 * 60 * 5,
  });

  // Get totalDocuments from backend response or compute based on data
  const totalDocuments = data?.totalDocuments || data?.total || 0;

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div
          className={`${modalPanelClass} w-96 max-h-[80vh] overflow-y-auto p-6`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold text-[#e8ddce]">
              My documents
            </h2>
            <button
              onClick={closeFileModal}
              className="text-[#766a59] hover:text-[#e8ddce] text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 mb-6">
            <p className="text-[#766a59] text-center py-4">Fetching...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div
          className={`${modalPanelClass} w-96 max-h-[80vh] overflow-y-auto p-6`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold text-[#e8ddce]">
              My documents
            </h2>
            <button
              onClick={closeFileModal}
              className="text-[#766a59] hover:text-[#e8ddce] text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 mb-6">
            <p className="text-[#766a59] text-center py-4">
              Something went wrong while fetching documents
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`${modalPanelClass} w-96 max-h-[80vh] overflow-y-auto p-6`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-[#e8ddce]">
            My documents
          </h2>
          <button
            onClick={closeFileModal}
            className="text-[#766a59] hover:text-[#e8ddce] text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {data.documents.length > 0 ? (
            data.documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleSelectDocument(doc)}
                className={`p-3 rounded-xl cursor-pointer transition-all truncate ${
                  selectedFileId === doc.id
                    ? "bg-gradient-to-br from-[#ffab6b] via-[#ff9450] to-[#e8752a] text-[#3a2010] font-semibold shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(80,30,5,0.3),4px_4px_10px_rgba(0,0,0,0.35)]"
                    : "bg-[#26211c] hover:bg-[#3a3128] text-[#e8ddce] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)]"
                }`}
              >
                <span className="truncate">
                  {doc.title || `Document ${doc.id}` || "Untitled"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-[#766a59] text-center py-4">
              No documents found
            </p>
          )}
        </div>

        {/* Pagination Controls */}
        {totalDocuments > 5 && (
          <div className="flex items-center justify-center gap-4 mb-4 pt-4">
            <button
              onClick={fetchPreviousDocuments}
              disabled={page === 0}
              className={secondaryBtnClass}
              title="Previous page"
            >
              ← Prev
            </button>
            <span className="text-[#766a59] text-sm">Page {page + 1}</span>
            <button
              onClick={fetchMoreDocuments}
              disabled={
                page * 5 + (data?.documents?.length || 0) >= totalDocuments
              }
              className={secondaryBtnClass}
              title="Next page"
            >
              Next →
            </button>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => document.getElementById("file-upload").click()}
            disabled={isUploading}
            className={`w-full ${primaryBtnClass}`}
            style={primaryBtnStyle}
          >
            {isUploading ? "Uploading..." : "Upload new document"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  });

  const totalQuizzes = data?.totalQuizzes || 0;

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-[#322b23] rounded-3xl p-6 w-96 shadow-[10px_10px_22px_rgba(0,0,0,0.5),-6px_-6px_16px_rgba(255,255,255,0.04)] font-body">
          <div className="flex flex-col items-center gap-3 text-[#cabaa2]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff9450] border-t-transparent" />
            <span>Loading quizzes...</span>
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
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-[#322b23] rounded-3xl p-6 w-96 max-h-[70vh] overflow-y-auto shadow-[10px_10px_22px_rgba(0,0,0,0.5),-6px_-6px_16px_rgba(255,255,255,0.04)] font-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold text-[#e8ddce]">
              Error
            </h2>
            <button
              onClick={closeSelectQuizModal}
              className="text-[#766a59] hover:text-[#e8ddce] text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 text-[#cabaa2] text-sm">
            <p>Something went wrong while fetching quizzes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#322b23] rounded-3xl p-6 w-96 max-h-[70vh] overflow-y-auto shadow-[10px_10px_22px_rgba(0,0,0,0.5),-6px_-6px_16px_rgba(255,255,255,0.04)] font-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-[#e8ddce]">
            Select a quiz
          </h2>
          <button
            onClick={closeSelectQuizModal}
            className="text-[#766a59] hover:text-[#e8ddce] text-2xl leading-none"
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
                className="w-full text-left p-3 rounded-2xl transition-all text-sm bg-[#26211c] hover:bg-[#3a3128] text-[#e8ddce] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)]"
              >
                <div className="font-medium truncate">{quiz.quizTitle}</div>
                <div className="text-xs text-[#766a59] mt-1">
                  Token: {quiz.shareToken}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-[#766a59] py-6 text-sm">
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
              className="px-3 py-2 rounded-xl text-[#e8ddce] transition-all text-sm bg-[#26211c] hover:bg-[#3a3128] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous page"
            >
              ← Prev
            </button>
            <span className="text-[#766a59] text-sm">Page {page + 1}</span>
            <button
              onClick={fetchMoreQuizzes}
              disabled={
                page * 5 + (data?.userQuizzes?.length || 0) >= totalQuizzes
              }
              className="px-3 py-2 rounded-xl text-[#e8ddce] transition-all text-sm bg-[#26211c] hover:bg-[#3a3128] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] disabled:opacity-40 disabled:cursor-not-allowed"
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
  currentQuiz,
  setCurrentQuiz,
  isFetching,
  handleFileUpload,
  isUploading,
}) {
  const { authFetch } = useContext(AuthContext);
  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [showFileModal, setShowFileModal] = useState(false);
  const [filePage, setFilePage] = useState(0);
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

  // ----------------------------------------------------------------------------
  // FILE MODAL HELPERS
  // ----------------------------------------------------------------------------

  const openFileModal = async () => {
    setShowFileModal(true);
  };

  const closeFileModal = () => {
    setShowFileModal(false);
    setFilePage(0);
  };

  const fetchMoreDocuments = () => {
    setFilePage(filePage + 1);
  };

  const fetchPreviousDocuments = () => {
    if (filePage > 0) {
      setFilePage(filePage - 1);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
      setShowFileModal(false);
    }
  };

  const handleSelectDocument = async (doc) => {
    // close modal and select immediately
    setShowFileModal(false);
    setSelectedFileId(doc.id);

    // ensure parent has an entry for this doc (without copying any large content)
    setUploadedFiles((prev) =>
      prev.some((f) => f.id === doc.id)
        ? prev
        : [
            ...prev,
            {
              id: doc.id,
              name: doc.title || String(doc.id),
              nickname: doc.title || String(doc.id),
              content: null,
            },
          ],
    );
  };

  const handleFileDelete = async (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }
  };

  const handleQuestionDelete = async (questionId) => {
    const confirmMessage = "Are you sure you wish to delete this question?";
    if (!window.confirm(confirmMessage)) return;
    if (!currentQuiz?.id) return;

    const previousSelectedQuestionId = selectedQuestionId;
    const queryKey = ["quizQuestions", currentQuiz.id];
    const previousQueryData = queryClient.getQueryData(queryKey);

    if (previousQueryData?.questionList) {
      queryClient.setQueryData(queryKey, (oldData) => ({
        ...oldData,
        questionList: oldData.questionList.filter((q) => q.id !== questionId),
      }));
    }

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
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to delete question",
        );
      }

      const result = await response.json();

      await queryClient.invalidateQueries({ queryKey: queryKey });
      toast.success(result.message);
    } catch (error) {
      console.error(error);
      if (previousQueryData) {
        queryClient.setQueryData(queryKey, previousQueryData);
      }
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
    if (!response || !response.ok) {
      const result = await response.json();
      throw new Error(
        result.errors?.map((e) => e.msg).join(", ") ||
          result?.message ||
          "failed to fetch quizzes",
      );
    }

    return await response.json();
  };

  const handleSelectQuiz = async (quiz) => {
    setCurrentQuiz(quiz);
    closeSelectQuizModal();
  };

  // ----------------------------------------------------------------------------
  // ERROR BOUNDARY
  // ----------------------------------------------------------------------------

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  // ------------------------------------------------------------------------------------
  // MAIN COMPONENT
  //-------------------------------------------------------------------------------------

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="w-full lg:w-52 bg-[#26211c] flex flex-col font-body p-3 gap-3">
        {/* File List - 30% */}
        <div className="h-[30%] rounded-2xl bg-[#322b23] p-4 overflow-y-auto shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-[#766a59] uppercase tracking-wide">
              Files
            </div>
            <button
              onClick={openFileModal}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-[#3a2010] font-bold leading-none transition-all hover:-translate-y-0.5 active:translate-y-0.5"
              style={primaryBtnStyle}
              title="Add file"
            >
              +
            </button>
          </div>
          <div className="space-y-1.5">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`py-1.5 px-2.5 rounded-xl text-sm flex items-center justify-between group transition-all ${
                    selectedFileId === file.id
                      ? "bg-gradient-to-br from-[#ffab6b] via-[#ff9450] to-[#e8752a] text-[#3a2010] font-medium shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(80,30,5,0.3),4px_4px_10px_rgba(0,0,0,0.35)]"
                      : "bg-[#26211c] hover:bg-[#3a3128] text-[#cabaa2] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.03)]"
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
                    className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                      selectedFileId === file.id
                        ? "text-[#3a2010] hover:text-black"
                        : "text-red-400 hover:text-red-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="text-[#5f5346] text-sm">No file uploaded</div>
            )}
          </div>
        </div>

        {/* Current Quiz - Small Section */}
        <div className="rounded-2xl p-3 bg-[#322b23] shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          <div className="text-xs font-semibold text-[#766a59] mb-3 uppercase tracking-wide">
            Current quiz
          </div>
          {currentQuiz ? (
            <div className="flex items-center justify-between w-full rounded-xl px-3 py-2 group bg-gradient-to-br from-[#ffab6b] via-[#ff9450] to-[#e8752a] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(80,30,5,0.3),4px_4px_10px_rgba(0,0,0,0.35)]">
              <span className="text-sm text-[#3a2010] font-medium truncate flex-1">
                {currentQuiz.quizTitle}
              </span>
              <button
                onClick={() => {
                  setCurrentQuiz(null);
                }}
                className="ml-2 text-[#3a2010] hover:text-black opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={openSelectQuizModal}
              className="text-xs text-[#ff9450] hover:text-[#ffb27a] underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select a quiz
            </button>
          )}
        </div>

        {/* Question List - 70% */}
        <div className="flex-1 rounded-2xl p-4 overflow-y-auto bg-[#322b23] shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          <div className="flex flex-row items-center justify-between mb-2">
            <div className="text-xs font-semibold text-[#766a59] uppercase tracking-wide">
              Questions
            </div>
          </div>
          <div className="space-y-1.5">
            {Array.isArray(questions) && questions.length > 0 ? (
              questions.map((question) => (
                <div
                  key={question.id}
                  className={`py-1.5 px-2.5 rounded-xl text-sm flex items-center justify-between group transition-all ${
                    selectedQuestionId === question.id
                      ? "bg-gradient-to-br from-[#ffab6b] via-[#ff9450] to-[#e8752a] text-[#3a2010] font-medium shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(80,30,5,0.3),4px_4px_10px_rgba(0,0,0,0.35)]"
                      : "bg-[#26211c] hover:bg-[#3a3128] text-[#cabaa2] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.03)]"
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
                    className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                      selectedQuestionId === question.id
                        ? "text-[#3a2010] hover:text-black"
                        : "text-red-400 hover:text-red-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : isFetching ? (
              <div className="space-y-1">
                <div className="text-[#5f5346] text-sm">Fetching...</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-[#5f5346] text-sm">No questions</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input, shared by the "+" button / FileModal upload button */}
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".pdf,.docx"
        onChange={(e) => {
          handleFileChange(e);
        }}
      />

      {/* File Modal */}
      {showFileModal && (
        <FileModal
          closeFileModal={closeFileModal}
          handleSelectDocument={handleSelectDocument}
          fetchMoreDocuments={fetchMoreDocuments}
          fetchPreviousDocuments={fetchPreviousDocuments}
          isUploading={isUploading}
          selectedFileId={selectedFileId}
          page={filePage}
          authFetch={authFetch}
        />
      )}

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
