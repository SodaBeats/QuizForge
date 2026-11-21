import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../components/ui/Modal";
import { Spinner } from "../../../components/ui/Spinner";

const ROLE_OPTIONS = ["student", "teacher", "admin"];

// Small modal: one role dropdown + Save. Server errors (e.g. invalid role)
// render inside the modal — same pattern as AddUserModal.
export function ChangeRoleModal({ user, onClose, onSubmit }) {
  const [role, setRole] = useState(user.role);
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({ id: user.id, body: { role } });
      toast.success("Role updated!");
      onClose();
    } catch (error) {
      setServerError(error?.message || "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      overlayClassName="px-4"
      panelClassName="modal-panel border border-muted w-[360px] max-w-full relative"
      closeOnBackdropClick={false}
      overlayChild={
        submitting && (
          <div className="absolute inset-0 z-60 flex items-center justify-center bg-modalback/70 rounded-lg">
            <Spinner size="lg" />
          </div>
        )
      }
    >
      <div className="flex items-center justify-between px-5 py-4 bg-ink rounded-t-lg border-b border-muted/20">
        <h2 className="text-sm font-display font-semibold text-inkondark">
          Change role
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-red-500 hover:text-red-700 text-xl leading-none border-none"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-muted font-body">
            {user.first_name} {user.last_name} · {user.email}
          </p>

          {serverError && (
            <div className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2">
              <p className="text-sm text-bad font-body">{serverError}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="change-role" className="text-xs font-medium text-inkondark">
              Role
            </label>
            <select
              id="change-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={submitting}
              className="input-well px-3 py-2 text-inkondark transition-all"
            >
              {ROLE_OPTIONS.map((option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-darkslate text-inkondark"
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary py-2 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
