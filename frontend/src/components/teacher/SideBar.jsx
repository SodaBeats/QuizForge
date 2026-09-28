import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { documentServices } from "../../services/documentServices";
const backendHost = import.meta.env.VITE_BACKEND_HOST;

// shared flat styling tokens - cosmetic only, referenced by className below
const primaryBtnClass =
  "font-display font-bold rounded-md px-4 py-2 bg-accent text-canvas transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0.5";
const secondaryBtnClass =
  "rounded-md px-4 py-2 transition-all text-ink bg-surface hover:bg-muted/10 border border-muted/30";
const modalPanelClass =
  "bg-surface rounded-lg border border-muted/20 font-body";

// ------------------------------------------------------------------------------------
// SUB COMPONENT: File picker/upload modal (moved here from TopBar)
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

  const totalDocuments = data?.totalDocuments || data?.total || 0;

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50">
        <div
          className={`${modalPanelClass} w-96 max-h-[80vh] overflow-y-auto p-6`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold text-ink">
              My documents
            </h2>
            <button
              onClick={closeFileModal}
              className="text-muted hover:text-ink text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 mb-6">
            <p className="text-muted text-center py-4">Fetching...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50">
        <div
          className={`${modalPanelClass} w-96 max-h-[80vh] overflow-y-auto p-6`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold text-ink">
              My documents
            </h2>
            <button
              onClick={closeFileModal}
              className="text-muted hover:text-ink text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 mb-6">
            <p className="text-muted text-center py-4">
              Something went wrong while fetching documents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50">
      <div
        className={`${modalPanelClass} w-96 max-h-[80vh] overflow-y-auto p-6`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-ink">
            My documents
          </h2>
          <button
            onClick={closeFileModal}
            className="text-muted hover:text-ink text-2xl leading-none"
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
                className={`p-3 rounded-md cursor-pointer transition-all truncate ${
                  selectedFileId === doc.id
                    ? "bg-accent text-canvas font-semibold "
                    : "bg-surface hover:bg-muted/10 text-ink border border-muted/20"
                }`}
              >
                <span className="truncate">
                  {doc.title || `Document ${doc.id}` || "Untitled"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted text-center py-4">No documents found</p>
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
            <span className="text-muted text-sm">Page {page + 1}</span>
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
          >
            {isUploading ? "Uploading..." : "Upload new document"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------
// SUB COMPONENT: Select Quiz Modal
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
  });

  const totalQuizzes = data?.totalQuizzes || 0;

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-6 w-96 border border-muted/20 font-body">
          <div className="flex flex-col items-center gap-3 text-ink">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
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
      <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-muted/20 font-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold text-ink">
              Error
            </h2>
            <button
              onClick={closeSelectQuizModal}
              className="text-muted hover:text-ink text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 text-ink text-sm">
            <p>Something went wrong while fetching quizzes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-96 max-h-[70vh] overflow-y-auto border border-muted/20 font-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-ink">
            Select a quiz
          </h2>
          <button
            onClick={closeSelectQuizModal}
            className="text-muted hover:text-ink text-2xl leading-none"
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
                className="w-full text-left p-3 rounded-lg transition-all text-sm bg-surface hover:bg-muted/10 text-ink border border-muted/20"
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
              className="px-3 py-2 rounded-md text-ink transition-all text-sm bg-surface hover:bg-muted/10 border border-muted/20 disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="px-3 py-2 rounded-md text-ink transition-all text-sm bg-surface hover:bg-muted/10 border border-muted/20 disabled:opacity-40 disabled:cursor-not-allowed"
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
  handleFileUpload, // passed in from the parent page (previously only went to TopBar)
  isUploading, // passed in from the parent page (previously only went to TopBar)
}) {
  const { authFetch } = useContext(AuthContext);
  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  // ---- File modal state/logic (moved here from TopBar) ----
  const [showFileModal, setShowFileModal] = useState(false);
  const [filePage, setFilePage] = useState(0);

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
  // ---- end file modal logic ----

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

      <div className="w-full lg:w-52 bg-surface flex flex-col font-body p-3 gap-3">
        {/* File List - 30% */}
        <div className="h-[30%] rounded-lg bg-surface p-4 overflow-y-auto border border-muted/20">
          <div className="flex flex-row items-center justify-between mb-3 pb-2 border-b border-muted/20">
            <div className="text-xs font-semibold text-ink uppercase tracking-wide">
              Files
            </div>
            <button
              onClick={openFileModal}
              title="Add file"
              className="w-6 h-6 flex items-center justify-center rounded-lg text-canvas bg-accent font-bold leading-none transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            >
              +
            </button>
          </div>
          <div className="space-y-1.5">
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`py-1.5 px-2.5 rounded-md text-sm flex items-center justify-between group transition-all ${
                    selectedFileId === file.id
                      ? "bg-accent text-canvas font-medium "
                      : "bg-surface hover:bg-muted/10 text-ink border border-muted/20"
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
                    }}
                    className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                      selectedFileId === file.id
                        ? "text-canvas hover:text-canvas"
                        : "text-red-400 hover:text-red-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="text-muted text-sm">No file uploaded</div>
            )}
          </div>
        </div>

        {/* Current Quiz - Small Section */}
        <div className="rounded-lg p-3 bg-surface border border-muted/20">
          <div className="text-xs font-semibold text-ink mb-3 uppercase tracking-wide border-b border-muted/20">
            Current quiz
          </div>
          {currentQuiz ? (
            <div className="flex items-center justify-between w-full rounded-md px-3 py-2 group bg-accent ">
              <span className="text-sm text-canvas font-medium truncate flex-1">
                {currentQuiz.quizTitle}
              </span>
              <button
                onClick={() => {
                  setCurrentQuiz(null);
                }}
                className="ml-2 text-canvas hover:text-canvas opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={openSelectQuizModal}
              className="text-xs text-accent hover:text-accent underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select a quiz
            </button>
          )}
        </div>

        {/* Question List - 70% */}
        <div className="flex-1 rounded-lg p-4 overflow-y-auto bg-surface border border-muted/20">
          <div className="flex flex-row items-center justify-between mb-2 border-b border-muted/20">
            <div className="mb-3 text-xs font-semibold text-ink uppercase tracking-wide">
              Questions
            </div>
          </div>
          <div className="space-y-1.5">
            {Array.isArray(questions) && questions.length > 0 ? (
              questions.map((question) => (
                <div
                  key={question.id}
                  className={`py-1.5 px-2.5 rounded-md text-sm flex items-center justify-between group transition-all ${
                    selectedQuestionId === question.id
                      ? "bg-accent text-canvas font-medium "
                      : "bg-surface hover:bg-muted/10 text-ink border border-muted/20"
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
                        ? "text-canvas hover:text-canvas"
                        : "text-red-400 hover:text-red-500"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : isFetching ? (
              <div className="space-y-1">
                <div className="text-canvas text-sm">Fetching...</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-muted text-sm">No questions</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* hidden file input for uploads, triggered from FileModal */}
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleFileChange}
      />

      {/* File Picker Modal (moved from TopBar) */}
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
