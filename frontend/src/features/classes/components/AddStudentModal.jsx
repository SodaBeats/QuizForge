// src/features/classes/components/AddStudentModal.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../components/ui/Modal";
import { useStudentLookup } from "../api/queries.js";

export function AddStudentModal({
  selectedClass,
  onClose,
  onSubmit,
  isSubmitting,
  setIsSubmitting,
}) {
  const [form, setForm] = useState({
    email: "",
  });
  const [debouncedEmail, setDebouncedEmail] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // email verification for adding student to class (debounced query)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(form.email.trim());
    }, 1000);

    return () => clearTimeout(timer);
  }, [form.email]);

  const {
    data: studentLookup,
    isFetching: isCheckingEmail,
    error: emailLookupError,
  } = useStudentLookup(selectedClass?.id, debouncedEmail);

  const emailIsStale = form.email.trim() !== debouncedEmail;
  const emailValid = !emailIsStale && Boolean(studentLookup);
  const emailCheckError =
    !emailIsStale && emailLookupError ? emailLookupError.message : "";
  const isEmailCheckPending = isCheckingEmail || (form.email && emailIsStale);

  const handleSubmit = async () => {
    if (!form.email) {
      toast.error("Please enter an email");
      return;
    }
    if (isEmailCheckPending) {
      toast.error("Waiting for email validation");
      return;
    }
    if (emailCheckError || !emailValid) {
      toast.error("Please fix the email before submitting");
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit(form);
      setIsSubmitting(false);
      onClose();
      setForm({ email: "" });
      toast.success("Student added!");
    } catch (error) {
      console.error(`Student addition error: ${error}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      overlayClassName="px-4"
      panelClassName="modal-panel border border-muted w-[420px] max-w-full relative"
      closeOnBackdropClick={false}
      overlayChild={
        isSubmitting && (
          <div className="absolute inset-0 z-60 flex items-center justify-center bg-modalback/70 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-t-transparent border-accent rounded-full animate-spin" />
              <div className="text-sm text-muted">Adding...</div>
            </div>
          </div>
        )
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-ink rounded-t-lg border-b border-muted/20">
        <h2 className="text-sm font-display font-semibold text-inkondark truncate pr-2">
          Add student to {selectedClass?.name}
        </h2>
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 text-xl leading-none border-none flex-shrink-0"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-inkondark">
            Student email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. student@example.com"
            className="input-well px-3 py-2 text-inkondark transition-all"
          />
          <div className="min-h-[1.25rem] text-xs">
            {isEmailCheckPending && (
              <span className="text-accent">Checking email...</span>
            )}
            {!isEmailCheckPending && emailCheckError && (
              <span className="text-red-400">{emailCheckError}</span>
            )}
            {!isEmailCheckPending && emailValid && (
              <span className="text-green-400">User exists</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-5 py-4">
        <button
          onClick={onClose}
          className="btn-secondary py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary py-2 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-600 hover:-translate-y-0.5 active:translate-y-0.5"
          disabled={
            isSubmitting ||
            isEmailCheckPending ||
            !!emailCheckError ||
            !emailValid
          }
        >
          Add student
        </button>
      </div>
    </Modal>
  );
}
