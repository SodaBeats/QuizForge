import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "./AuthProvider";
import toast from "react-hot-toast";
import { classServices } from "../services/classServices";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

// shared clay styling tokens — cosmetic only, referenced by className below
const wellInputClass =
  "w-full px-3 py-2 bg-[#26211c] rounded-xl text-[#e8ddce] text-sm placeholder:text-[#766a59] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-3px_-3px_7px_rgba(255,255,255,0.04)] focus:outline-none focus:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.45),inset_-4px_-4px_8px_rgba(255,255,255,0.04),0_0_0_3px_rgba(255,148,80,0.35)] transition";
const labelClass = "block text-sm font-medium text-[#cabaa2] mb-1";
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

// -------------------------------------------------------------------------------------
//  SUB-COMPONENTS
// -------------------------------------------------------------------------------------
function ClassAccessibilityDropdown({
  selectedClassIds,
  setForgeQuizData,
  userClasses,
  isFetchingClasses,
  classFetchError,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleClass = (classId) => {
    setForgeQuizData((prev) => {
      const currentIds = prev.selectedClassIds || [];
      const isSelected = currentIds.includes(classId);
      const nextIds = isSelected
        ? currentIds.filter((id) => id !== classId)
        : [...currentIds, classId];
      return { ...prev, selectedClassIds: nextIds };
    });
  };

  const handleClearAll = () => {
    setForgeQuizData((prev) => ({
      ...prev,
      selectedClassIds: [],
    }));
  };

  const displayText =
    selectedClassIds.length === 0
      ? "Anyone with the code"
      : selectedClassIds.length === 1
        ? `${userClasses?.find((c) => c.id === selectedClassIds[0])?.name}`
        : `${selectedClassIds.length} classes selected`;

  return (
    <div className="relative font-body" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`${wellInputClass} text-left flex items-center justify-between`}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 transition-transform text-[#766a59] ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-20 max-h-48 overflow-y-auto bg-[#26211c] shadow-[6px_6px_14px_rgba(0,0,0,0.45),-4px_-4px_10px_rgba(255,255,255,0.03)]">
          {/* "Anyone with the code" option */}
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-[#cabaa2] hover:bg-[#3a3128] cursor-pointer">
            <input
              type="checkbox"
              checked={selectedClassIds.length === 0}
              onChange={handleClearAll}
              className="h-4 w-4 rounded cursor-pointer accent-[#ff9450]"
            />
            <span>Anyone with the code</span>
          </label>

          {isFetchingClasses ? (
            <p className="px-3 py-2 text-[#766a59] text-sm">
              Loading classes...
            </p>
          ) : classFetchError ? (
            <p className="px-3 py-2 text-red-400 text-xs">
              Unable to load classes.
            </p>
          ) : userClasses?.length ? (
            userClasses.map((cls) => (
              <label
                key={cls.id}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#cabaa2] hover:bg-[#3a3128] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedClassIds.includes(cls.id)}
                  onChange={() => handleToggleClass(cls.id)}
                  className="h-4 w-4 rounded cursor-pointer accent-[#ff9450]"
                />
                <span>{cls.name}</span>
              </label>
            ))
          ) : (
            <p className="px-3 py-2 text-[#766a59] text-sm">
              No classes found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function QuizForgeModal({
  forgeQuizData,
  handleForgeQuiz,
  isCreatingQuiz,
  closeForgeQuizModal,
  setForgeQuizData,
  userClasses,
  isFetchingClasses,
  classFetchError,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className={`${modalPanelClass} p-6 w-[500px] max-w-full mx-4`}>
        <h2 className="text-xl font-display font-semibold mb-4 text-[#e8ddce]">
          Forge quiz
        </h2>
        <div className="space-y-4">
          {/* Quiz Title */}
          <div>
            <label className={labelClass}>Quiz title</label>
            <input
              type="text"
              value={forgeQuizData.quizTitle}
              onChange={(e) =>
                setForgeQuizData((prev) => ({
                  ...prev,
                  quizTitle: e.target.value,
                }))
              }
              className={wellInputClass}
              placeholder="Enter quiz title"
            />
          </div>

          {/* Quiz Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={forgeQuizData.description}
              onChange={(e) =>
                setForgeQuizData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={`${wellInputClass} resize-none`}
              rows="3"
              placeholder="Enter quiz description"
            />
          </div>

          {/* Share Token */}
          <div>
            <label className={labelClass}>Share token</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={forgeQuizData.shareToken}
                readOnly
                className={`flex-1 ${wellInputClass} text-[#766a59]`}
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
                className={primaryBtnClass}
                style={primaryBtnStyle}
                disabled={!forgeQuizData.shareToken}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Accessibility */}
          <div>
            <label className={labelClass}>Accessibility</label>
            <ClassAccessibilityDropdown
              selectedClassIds={forgeQuizData.selectedClassIds}
              setForgeQuizData={setForgeQuizData}
              userClasses={userClasses}
              isFetchingClasses={isFetchingClasses}
              classFetchError={classFetchError}
            />
            <p className="text-xs text-[#766a59] mt-2">
              Leave as "Anyone with the code" or restrict to specific classes.
            </p>
          </div>

          {/* Max Attempts and Status - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Max Attempts */}
            <div>
              <label className={labelClass}>Max attempts</label>
              <input
                type="number"
                value={forgeQuizData.maxAttempts}
                onChange={(e) =>
                  setForgeQuizData((prev) => ({
                    ...prev,
                    maxAttempts: e.target.value,
                  }))
                }
                className={wellInputClass}
                placeholder="1"
                min="1"
              />
            </div>
            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={forgeQuizData.status || "draft"}
                onChange={(e) =>
                  setForgeQuizData((prev) => ({
                    ...prev,
                    status: e.target.value.toLowerCase(),
                  }))
                }
                className={wellInputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className={labelClass}>Due date</label>
            <input
              type="datetime-local"
              value={forgeQuizData.dueDate}
              onChange={(e) =>
                setForgeQuizData((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
              className={wellInputClass}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleForgeQuiz}
            disabled={isCreatingQuiz}
            className={`flex-1 ${primaryBtnClass}`}
            style={primaryBtnStyle}
          >
            {isCreatingQuiz ? "Creating quiz..." : "Create quiz"}
          </button>
          <button
            onClick={closeForgeQuizModal}
            disabled={isCreatingQuiz}
            className={`flex-1 ${secondaryBtnClass}`}
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

export default function TopBar({ selectedFile, setQuizMetadata }) {
  // -------------------------------------------------------------------------------------
  //  STATES AND VARIABLES
  // -------------------------------------------------------------------------------------
  //eslint-disable-next-line
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isForgeQuizModalOpen, setIsForgeQuizModalOpen] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [forgeQuizData, setForgeQuizData] = useState({
    quizTitle: "",
    description: "",
    shareToken: "",
    maxAttempts: 1,
    dueDate: "",
    status: "draft",
    accessibility: "anyone",
    selectedClassIds: [],
  });

  const menuRef = useRef(null);
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

  const handleLogout = async () => {
    const confirmMessage = "Are you sure you want to log out?";
    if (!window.confirm(confirmMessage)) return;
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      alert("Error: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const openForgeQuizModal = () => {
    // generate share token
    const quizToken = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Pre-fill with selected file name
    setForgeQuizData({
      quizTitle: selectedFile?.name || "",
      description: "",
      shareToken: quizToken,
      maxAttempts: 1,
      dueDate: "",
      status: "draft",
      accessibility: "anyone",
      selectedClassIds: [],
    });
    setIsForgeQuizModalOpen(true);
  };

  useEffect(() => {
    if (location.pathname !== "/teacher") {
      return;
    }

    if (location.state?.openForgeQuizModal === true) {
      openForgeQuizModal();
      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    } // eslint-disable-next-line
  }, [location.pathname, location.state, navigate]);

  const closeForgeQuizModal = () => {
    setIsForgeQuizModalOpen(false);
    setForgeQuizData({
      quizTitle: "",
      description: "",
      shareToken: "",
      maxAttempts: 0,
      dueDate: "",
      status: "draft",
      accessibility: "anyone",
      selectedClassIds: [],
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
    const selectedClassIds = forgeQuizData.selectedClassIds || [];
    const accessibility = selectedClassIds.length > 0 ? "restricted" : "anyone";

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
          accessibility,
          classIds: selectedClassIds,
        }),
        credentials: "include",
      });

      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "Quiz creation failed",
        );
      }

      const data = await response.json();

      setQuizMetadata(data.quiz);
      toast.success(data.message);
      closeForgeQuizModal();
    } catch (error) {
      console.error("Error creating quiz: ", error);
      toast.error(error.message);
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const {
    data: userClasses,
    isFetching: isFetchingClasses,
    error: classFetchError,
  } = useQuery({
    queryKey: ["userClasses"],
    queryFn: () => classServices.fetchClasses(authFetch),
    enabled: isForgeQuizModalOpen,
    staleTime: 1000 * 60 * 5,
  });

  // ----------------------------------------------------------------------------
  // ERROR BOUNDARY
  // ----------------------------------------------------------------------------
  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  // -------------------------------------------------------------------------------------
  //  RETURN
  // -------------------------------------------------------------------------------------

  return (
    <div className="mx-4 mt-4 px-5 py-3 flex items-center justify-between rounded-3xl bg-[#322b23] shadow-[10px_10px_22px_rgba(0,0,0,0.4),-6px_-6px_16px_rgba(255,255,255,0.04)]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* LEFT SIDE: Logo */}
      <Link
        to="/teacher"
        className="flex items-center gap-2.5 cursor-pointer group"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-[#3a2010] text-sm"
          style={{
            background: "linear-gradient(150deg, #ffab6b, #e8752a)",
            boxShadow:
              "inset 2px 2px 4px rgba(255,255,255,0.4), inset -3px -3px 6px rgba(80,30,5,0.4), 4px 4px 10px rgba(0,0,0,0.4)",
          }}
        >
          Q
        </div>
        <span className="font-display text-base font-bold text-[#e8ddce] group-hover:text-[#ff9450] transition-colors">
          QuizForge
        </span>
      </Link>

      {/* RIGHT SIDE: Actions */}
      <div className="flex items-center gap-3 font-body">
        {/* Forge Quiz Button */}
        {showFileButton && (
          <button
            className={primaryBtnClass}
            style={primaryBtnStyle}
            onClick={openForgeQuizModal}
          >
            Forge quiz
          </button>
        )}

        {/* Forge Quiz Modal */}
        {isForgeQuizModalOpen && (
          <QuizForgeModal
            forgeQuizData={forgeQuizData}
            setForgeQuizData={setForgeQuizData}
            handleForgeQuiz={handleForgeQuiz}
            isCreatingQuiz={isCreatingQuiz}
            closeForgeQuizModal={closeForgeQuizModal}
            userClasses={userClasses}
            isFetchingClasses={isFetchingClasses}
            classFetchError={classFetchError}
          />
        )}

        {/* PROFILE DROPDOWN */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all"
            style={{
              background: "linear-gradient(150deg, #ffab6b, #e8752a)",
              boxShadow:
                "inset 2px 2px 4px rgba(255,255,255,0.4), inset -3px -3px 6px rgba(80,30,5,0.4), 4px 4px 10px rgba(0,0,0,0.4)",
            }}
          >
            <span className="text-[#3a2010] text-xs font-display font-bold">
              JD
            </span>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl py-2 z-50 bg-[#26211c] shadow-[8px_8px_18px_rgba(0,0,0,0.5),-6px_-6px_14px_rgba(255,255,255,0.04)]">
              <button
                className="w-full text-left px-4 py-2 text-sm text-[#cabaa2] hover:bg-[#3a3128] hover:text-[#e8ddce] transition-colors"
                onClick={() => {
                  navigate("/teacher/quizzes");
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
              >
                Quizzes
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-[#cabaa2] hover:bg-[#3a3128] hover:text-[#e8ddce] transition-colors"
                onClick={() => {
                  navigate("/teacher/classes");
                  setIsProfileMenuOpen(false);
                }}
              >
                Classes
              </button>

              <div className="h-px bg-black/20 my-1"></div>

              <button
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#3a3128] transition-colors"
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
