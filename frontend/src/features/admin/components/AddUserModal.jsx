// src/features/admin/components/AddUserModal.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../components/ui/Modal";
import { Spinner } from "../../../components/ui/Spinner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_OPTIONS = ["student", "teacher", "admin"];

export function AddUserModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm: "",
    role: "student",
    is_verified: "false",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the field's error as the user fixes it.
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  };

  const validate = () => {
    const errors = {};
    if (!form.first_name.trim()) errors.first_name = "First name is required";
    if (!form.last_name.trim()) errors.last_name = "Last name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = "Enter a valid email address";
    }
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!form.confirm) errors.confirm = "Confirm your password";
    else if (form.confirm !== form.password) {
      errors.confirm = "Passwords do not match";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        is_verified: form.is_verified === "true",
      });
      toast.success("User created!");
      onClose();
    } catch (error) {
      // Server errors (e.g. "Email already exists") render inside the modal.
      setServerError(error?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      overlayClassName="px-4"
      panelClassName="modal-panel border border-muted w-[420px] max-w-full max-h-[90vh] overflow-y-auto relative"
      closeOnBackdropClick={false}
      overlayChild={
        submitting && (
          <div className="absolute inset-0 z-60 flex items-center justify-center bg-modalback/70 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <div className="text-sm text-muted">Creating...</div>
            </div>
          </div>
        )
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-ink rounded-t-lg border-b border-muted/20">
        <h2 className="text-sm font-display font-semibold text-inkondark">
          Add a new user
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
        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {serverError && (
            <div className="rounded-md border border-bad/40 bg-bad/10 px-3 py-2">
              <p className="text-sm text-bad font-body">{serverError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="first_name" className="text-xs font-medium text-inkondark">
                First name
              </label>
              <input
                id="first_name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                disabled={submitting}
                autoComplete="off"
                className="input-well px-3 py-2 text-inkondark transition-all"
              />
              {fieldErrors.first_name && (
                <p className="text-xs text-bad">{fieldErrors.first_name}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="last_name" className="text-xs font-medium text-inkondark">
                Last name
              </label>
              <input
                id="last_name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                disabled={submitting}
                autoComplete="off"
                className="input-well px-3 py-2 text-inkondark transition-all"
              />
              {fieldErrors.last_name && (
                <p className="text-xs text-bad">{fieldErrors.last_name}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-inkondark">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="off"
              className="input-well px-3 py-2 text-inkondark transition-all"
            />
            {fieldErrors.email && <p className="text-xs text-bad">{fieldErrors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-inkondark">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="new-password"
              className="input-well px-3 py-2 text-inkondark transition-all"
            />
            {fieldErrors.password && (
              <p className="text-xs text-bad">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-xs font-medium text-inkondark">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              disabled={submitting}
              autoComplete="new-password"
              className="input-well px-3 py-2 text-inkondark transition-all"
            />
            {fieldErrors.confirm && <p className="text-xs text-bad">{fieldErrors.confirm}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-xs font-medium text-inkondark">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={submitting}
                className="input-well px-3 py-2 text-inkondark transition-all"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role} className="bg-darkslate text-inkondark">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="is_verified" className="text-xs font-medium text-inkondark">
                Verified
              </label>
              <select
                id="is_verified"
                name="is_verified"
                value={form.is_verified}
                onChange={handleChange}
                disabled={submitting}
                className="input-well px-3 py-2 text-inkondark transition-all"
              >
                <option value="true" className="bg-darkslate text-inkondark">
                  true
                </option>
                <option value="false" className="bg-darkslate text-inkondark">
                  false
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            Add User
          </button>
        </div>
      </form>
    </Modal>
  );
}
