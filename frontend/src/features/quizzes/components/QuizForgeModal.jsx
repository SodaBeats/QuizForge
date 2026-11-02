import toast from "react-hot-toast";
import { ClassAccessibilityDropdown } from "./ClassAccessibilityDropdown";
import { Modal } from "../../../components/ui/Modal";

const labelClass = "block text-sm font-medium text-inkondark mb-1";

export function QuizForgeModal({
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

        <div className="grid grid-cols-2 gap-4">
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
