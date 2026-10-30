import React, { useState, useContext, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import toast from "react-hot-toast";
import { useClasses } from "../../features/classes/api/queries.js";
import { useCreateQuiz } from "../../features/quizzes/api/mutations.js";
import ConfirmDialog from "../ui/ConfirmDialog";
import Dropdown from "../ui/Dropdown";
import Modal from "../ui/Modal";
const labelClass = "block text-sm font-medium text-inkondark mb-1";
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
    <Dropdown className="relative font-body">
      {({ open: isDropdownOpen, toggle }) => (
        <>
          <button
            onClick={toggle}
            className="input-well w-full px-3 py-2 text-muted transition text-left flex items-center justify-between"
          >
            <span className="truncate">{displayText}</span>
            <svg
              className={`w-4 h-4 transition-transform text-muted ${
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
            <div className="absolute top-full left-0 right-0 mt-1 rounded-md z-20 max-h-48 overflow-y-auto bg-surface border border-muted/20">
              {/* "Anyone with the code" option */}
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-inkondark hover:bg-muted/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClassIds.length === 0}
                  onChange={handleClearAll}
                  className="h-4 w-4 rounded cursor-pointer accent-accent"
                />
                <span>Anyone with the code</span>
              </label>

              {isFetchingClasses ? (
                <p className="px-3 py-2 text-muted text-sm">
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-inkondark hover:bg-muted/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => handleToggleClass(cls.id)}
                      className="h-4 w-4 rounded cursor-pointer accent-accent"
                    />
                    <span>{cls.name}</span>
                  </label>
                ))
              ) : (
                <p className="px-3 py-2 text-muted text-sm">
                  No classes found.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Dropdown>
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
    <Modal
      onClose={closeForgeQuizModal}
      panelClassName="modal-panel border border-muted p-6 w-[500px] max-w-full mx-4"
      closeOnBackdropClick={false}
    >
      <h2 className="text-xl font-display font-semibold mb-4 text-inkondark">
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
            className="input-well w-full px-3 py-2 text-muted transition"
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
            className="input-well w-full px-3 py-2 text-muted transition resize-none"
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
              className="flex-1 input-well w-full px-3 py-2 transition text-muted"
              placeholder="Generating token..."
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(forgeQuizData.shareToken);
                toast.success("Token copied to clipboard!", {
                  duration: 2000,
                  style: {
                    background: "#10B981",
                    color: "var(--ink)",
                  },
                });
              }}
              className="btn-primary py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
              disabled={!forgeQuizData.shareToken}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Accessibility */}
        <div>
          <label className={labelClass}>Who can access</label>
          <ClassAccessibilityDropdown
            selectedClassIds={forgeQuizData.selectedClassIds}
            setForgeQuizData={setForgeQuizData}
            userClasses={userClasses}
            isFetchingClasses={isFetchingClasses}
            classFetchError={classFetchError}
          />
          <p className="text-xs text-muted mt-2">
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
              className="input-well w-full px-3 py-2 text-muted transition"
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
              className="input-well w-full px-3 py-2 text-muted transition"
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
            className="input-well w-full px-3 py-2 text-muted transition"
          />
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleForgeQuiz}
          disabled={isCreatingQuiz}
          className="flex-1 btn-primary py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
        >
          {isCreatingQuiz ? "Creating quiz..." : "Create quiz"}
        </button>
        <button
          onClick={closeForgeQuizModal}
          disabled={isCreatingQuiz}
          className="flex-1 btn-danger py-2"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

// -------------------------------------------------------------------------------------
//  MAIN COMPONENT
// -------------------------------------------------------------------------------------

// logoClass: extra classes for the logo link — e.g. "lg:hidden" on pages where the
// sidebar owns the logo at lg+ (the topbar then only shows it on mobile).
export default function TopBar({
  selectedFile,
  setQuizMetadata,
  logoClass = "",
}) {
  // -------------------------------------------------------------------------------------
  //  STATES AND VARIABLES
  // -------------------------------------------------------------------------------------
  //eslint-disable-next-line
  const [isLoading, setIsLoading] = useState(false);
  const [isForgeQuizModalOpen, setIsForgeQuizModalOpen] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const showFileButton = location.pathname === "/teacher";
  const navigate = useNavigate();
  const createQuiz = useCreateQuiz();

  // -------------------------------------------------------------------------------------
  //  FUNCTIONS
  // -------------------------------------------------------------------------------------

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      toast.error(error.message || "Something went wrong while logging out");
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

      const data = await createQuiz.mutateAsync({
        quizTitle: forgeQuizData.quizTitle,
        description: forgeQuizData.description,
        shareToken: forgeQuizData.shareToken,
        maxAttempts: maxAttempts,
        dueDate: finalDueDate,
        status: forgeQuizData.status,
        accessibility,
        classIds: selectedClassIds,
      });

      setQuizMetadata(data.quiz);
      toast.success(data.message);
      closeForgeQuizModal();
    } catch (error) {
      console.error("Error creating quiz: ", error);
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const {
    data: userClasses,
    isFetching: isFetchingClasses,
    error: classFetchError,
  } = useClasses({ enabled: isForgeQuizModalOpen });

  // -------------------------------------------------------------------------------------
  //  RETURN
  // -------------------------------------------------------------------------------------

  return (
    <>
      <div className="px-5 py-3 flex items-center justify-between bg-specialsurface z-40 border-b-2 border-accent/20">
        {/* LEFT SIDE: Logo (hidden at lg+ when the sidebar owns it — see logoClass) */}
        <Link
          to="/teacher"
          className={`flex items-center gap-2.5 cursor-pointer group ${logoClass}`}
        >
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center font-display font-extrabold text-inkondark text-sm"
            style={{
              background: "var(--accent)",
            }}
          >
            Q
          </div>
          <span className="font-display text-base font-bold text-inkondark group-hover:text-accent transition-colors">
            Ilmari<span className="text-accent">Gen</span>
          </span>
        </Link>

        {/* RIGHT SIDE: Actions (ml-auto keeps them right even when the logo is hidden) */}
        <div className="flex items-center gap-3 font-body ml-auto">
          {/* Forge Quiz Button */}
          {showFileButton && (
            <button
              className="btn-primary py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
              onClick={openForgeQuizModal}
            >
              Forge quiz
            </button>
          )}

          {/* PROFILE DROPDOWN */}
          <Dropdown>
            {({ open, toggle, close }) => (
              <>
                <button
                  onClick={toggle}
                  className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-all bg-accent"
                >
                  <span className="text-inkondark text-xs font-display font-bold">
                    JD
                  </span>
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg py-2 z-50 bg-specialsurface border-2 border-muted">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-inkondark hover:bg-mutedteal transition-colors"
                      onClick={() => {
                        navigate("/teacher/quizzes");
                        close();
                      }}
                    >
                      Quizzes
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-inkondark hover:bg-mutedteal transition-colors"
                      onClick={() => {
                        navigate("/teacher/classes");
                        close();
                      }}
                    >
                      Classes
                    </button>

                    <div className="h-px bg-muted/20 my-1"></div>

                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-mutedteal transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </Dropdown>
        </div>
      </div>

      {/* Forge Quiz Modal — kept OUTSIDE the top bar */}
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

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
