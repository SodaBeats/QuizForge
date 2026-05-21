import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "./AuthProvider";
import toast from "react-hot-toast";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

function QuizForgeModal({
  forgeQuizData,
  handleForgeQuiz,
  isCreatingQuiz,
  closeForgeQuizModal,
  setForgeQuizData,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-white">Forge Quiz</h2>
        <div className="space-y-4">
          {/* Quiz Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quiz Title
            </label>
            <input
              type="text"
              value={forgeQuizData.quizTitle}
              onChange={(e) =>
                setForgeQuizData((prev) => ({
                  ...prev,
                  quizTitle: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter quiz title"
            />
          </div>

          {/* Quiz Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={forgeQuizData.description}
              onChange={(e) =>
                setForgeQuizData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
              rows="3"
              placeholder="Enter quiz description"
            />
          </div>

          {/* Share Token */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Share Token
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={forgeQuizData.shareToken}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-400"
                placeholder="Generating token..."
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(forgeQuizData.shareToken);
                  toast.success("Token copied to clipboard!", {
                    duration: 2000,
                    style: {
                      background: "#10B981",
                      color: "#fff",
                    },
                  });
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={!forgeQuizData.shareToken}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Max Attempts and Status - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Max Attempts */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Attempts
              </label>
              <input
                type="number"
                value={forgeQuizData.maxAttempts}
                onChange={(e) =>
                  setForgeQuizData((prev) => ({
                    ...prev,
                    maxAttempts: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="2"
                min="1"
              />
            </div>
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                value={forgeQuizData.status || "draft"}
                onChange={(e) =>
                  setForgeQuizData((prev) => ({
                    ...prev,
                    status: e.target.value.toLowerCase(),
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              value={forgeQuizData.dueDate}
              onChange={(e) =>
                setForgeQuizData((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleForgeQuiz}
            disabled={isCreatingQuiz}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingQuiz ? "Creating Quiz..." : "Create Quiz"}
          </button>
          <button
            onClick={closeForgeQuizModal}
            disabled={isCreatingQuiz}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------
//  MAIN COMPONENT
// -------------------------------------------------------------------------------------

export default function TopBar({
  handleFileUpload,
  isUploading,
  setSelectedFileId,
  selectedFileId,
  setUploadedFiles,
  selectedFile,
  setQuizMetadata,
}) {
  // -------------------------------------------------------------------------------------
  //  STATES AND VARIABLES
  // -------------------------------------------------------------------------------------
  //eslint-disable-next-line
  const [isLoading, setIsLoading] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isForgeQuizModalOpen, setIsForgeQuizModalOpen] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [page, setPage] = useState(0);
  const [forgeQuizData, setForgeQuizData] = useState({
    quizTitle: "",
    description: "",
    shareToken: "",
    maxAttempts: 0,
    dueDate: "",
    status: "draft",
  });

  const menuRef = useRef(null);
  //const fileRef = useRef(null);
  const { logout, authFetch } = useContext(AuthContext);

  const location = useLocation();
  const showFileButton = location.pathname === "/teacher";
  const navigate = useNavigate();

  // -------------------------------------------------------------------------------------
  //  FUNCTIONS
  // -------------------------------------------------------------------------------------

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
      setShowFileModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  // open file modal and fetch documents list
  const openFileModal = async () => {
    setShowFileModal(true);
  };

  const fetchDocs = async (page = 0) => {
    const offset = page * 5;
    const response = await authFetch(
      `${backendHost}/api/documents?limit=5&offset=${offset}`,
      { credentials: "include" },
    );
    if (!response) {
      throw new Error("Authentication failed or no response received");
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const closeFileModal = () => {
    setShowFileModal(false);
    setPage(0);
  };

  const fetchMoreDocuments = () => {
    setPage(page + 1);
  };

  const fetchPreviousDocuments = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const openForgeQuizModal = () => {
    // Pre-fill with selected file name
    const quizToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    setForgeQuizData({
      quizTitle: selectedFile?.name || "",
      description: "",
      shareToken: quizToken,
      maxAttempts: 0,
      dueDate: "",
      status: "draft",
    });
    setIsForgeQuizModalOpen(true);
  };

  const closeForgeQuizModal = () => {
    setIsForgeQuizModalOpen(false);
    setForgeQuizData({
      quizTitle: "",
      description: "",
      shareToken: "",
      maxAttempts: 0,
      dueDate: "",
      status: "draft",
    });
  };

  const handleForgeQuiz = async () => {
    // Validate required fields
    if (
      !forgeQuizData.dueDate ||
      !forgeQuizData.quizTitle ||
      !forgeQuizData.maxAttempts ||
      !forgeQuizData.status
    ) {
      toast.error("Please input all required fields");
      return;
    }

    const maxAttempts = Number(forgeQuizData.maxAttempts);
    if (
      typeof maxAttempts !== "number" ||
      isNaN(maxAttempts) ||
      maxAttempts <= 0
    ) {
      toast.error("Max attempts must be a valid number");
      return;
    }

    setIsCreatingQuiz(true);

    try {
      const finalDueDate = new Date(forgeQuizData.dueDate).toISOString();

      const response = await authFetch(`${backendHost}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizTitle: forgeQuizData.quizTitle,
          description: forgeQuizData.description,
          shareToken: forgeQuizData.shareToken,
          maxAttempts: maxAttempts,
          dueDate: finalDueDate,
          status: forgeQuizData.status,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        const errorMsg =
          data.message ||
          (Array.isArray(data.errors)
            ? data.errors.map((e) => e.msg).join(", ")
            : "Quiz creation failed");
        toast.error(errorMsg);
        console.error(data);
        return;
      }
      console.log(data.quiz);

      setQuizMetadata(data.quiz);
      toast.success(data.message);
      closeForgeQuizModal();
    } catch (error) {
      console.error("Error creating quiz: ", error);
      toast.error(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsCreatingQuiz(false);
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

  // -------------------------------------------------------------------------------------
  //  SUB-COMPONENTS
  // -------------------------------------------------------------------------------------
  function FileModal({
    closeFileModal,
    handleSelectDocument,
    fetchMoreDocuments,
    fetchPreviousDocuments,
    isUploading,
    selectedFileId,
    page,
  }) {
    const { data, isFetching, error } = useQuery({
      queryKey: ["docFetch", page],
      queryFn: () => fetchDocs(page),
      staleTime: 1000 * 60 * 5,
      refetchOnMount: false,
    });

    // Get totalDocuments from backend response or compute based on data
    const totalDocuments = data?.totalDocuments || data?.total || 0;

    if (isFetching) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">My Documents</h2>
              <button
                onClick={closeFileModal}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-gray-400 text-center py-4">Fetching...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">My Documents</h2>
              <button
                onClick={closeFileModal}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-gray-400 text-center py-4">
                Something went wrong while fetching documents
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">My Documents</h2>
            <button
              onClick={closeFileModal}
              className="text-gray-400 hover:text-white text-2xl leading-none"
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
                  className={`p-3 rounded cursor-pointer border transition-colors text-white truncate ${
                    selectedFileId === doc.id
                      ? "bg-blue-600 border-blue-500"
                      : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                  }`}
                >
                  <span className="truncate">
                    {doc.title || `Document ${doc.id}` || "Untitled"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">
                No documents found
              </p>
            )}
          </div>

          {/* Pagination Controls */}
          {totalDocuments > 5 && (
            <div className="flex items-center justify-center gap-4 mb-4 border-t border-gray-700 pt-4">
              <button
                onClick={fetchPreviousDocuments}
                disabled={page === 0}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded border border-gray-600 transition-colors"
                title="Previous page"
              >
                ← Prev
              </button>
              <span className="text-gray-400 text-sm">Page {page + 1}</span>
              <button
                onClick={fetchMoreDocuments}
                disabled={
                  page * 5 + (data?.documents?.length || 0) >= totalDocuments
                }
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded border border-gray-600 transition-colors"
                title="Next page"
              >
                Next →
              </button>
            </div>
          )}

          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={() => document.getElementById("file-upload").click()}
              disabled={isUploading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded border border-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Upload New Document"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  // -------------------------------------------------------------------------------------
  //  RETURN
  // -------------------------------------------------------------------------------------

  return (
    <div className="border-b border-gray-700 p-4 flex items-center justify-between bg-gray-900">
      {/* LEFT SIDE: Logo */}
      <Link
        to="/teacher"
        className="text-xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors"
      >
        QuizForge
      </Link>

      {/* RIGHT SIDE: Actions */}
      <div className="flex items-center gap-4">
        {/* Files Section */}
        {showFileButton && (
          <>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 transition-colors"
                onClick={openFileModal}
              >
                Files
              </button>

              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded border border-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={openForgeQuizModal}
              >
                Forge Quiz
              </button>

              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx"
                onChange={(e) => {
                  handleFileChange(e);
                }}
              />

              {/* Modal Logic Remains the Same */}
              {showFileModal && (
                <FileModal
                  closeFileModal={closeFileModal}
                  handleSelectDocument={handleSelectDocument}
                  fetchMoreDocuments={fetchMoreDocuments}
                  fetchPreviousDocuments={fetchPreviousDocuments}
                  isUploading={isUploading}
                  selectedFileId={selectedFileId}
                  page={page}
                />
              )}
            </div>
          </>
        )}

        {/* Forge Quiz Modal */}
        {isForgeQuizModalOpen && (
          <QuizForgeModal
            forgeQuizData={forgeQuizData}
            setForgeQuizData={setForgeQuizData}
            handleForgeQuiz={handleForgeQuiz}
            isCreatingQuiz={isCreatingQuiz}
            closeForgeQuizModal={closeForgeQuizModal}
          />
        )}

        {/* PROFILE DROPDOWN */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-10 h-10 rounded-full bg-blue-600 border-2 border-gray-700 
              hover:border-blue-400 flex items-center justify-center overflow-hidden transition-all"
          >
            {/* Placeholder for Profile Image */}
            <span className="text-white text-xs font-bold">JD</span>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50">
              <button
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => {
                  /* Navigate to Dashboard */ setIsProfileMenuOpen(false);
                }}
              >
                Dashboard
              </button>
              <button
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => {
                  navigate("/teacher/quizzes");
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
              >
                Quizzes
              </button>
              <button
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                onClick={() => {
                  /* Navigate to Students */ setIsProfileMenuOpen(false);
                }}
              >
                Classes
              </button>

              <div className="border-t border-gray-700 my-1"></div>

              <button
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
