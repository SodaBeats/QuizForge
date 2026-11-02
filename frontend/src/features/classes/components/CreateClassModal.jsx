// src/features/classes/components/CreateClassModal.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../components/ui/Modal";

export function CreateClassModal({
  onClose,
  onSubmit,
  isSubmitting,
  setIsSubmitting,
}) {
  const [form, setForm] = useState({
    className: "",
    subject: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.className || !form.subject) {
      toast.error("Incomplete Input");
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit(form);
      setIsSubmitting(false);
      onClose();
      setForm({ className: "", subject: "" });
      toast.success("Class Created!");
    } catch (error) {
      console.error(`Classes creation error: ${error}`);
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
              <div className="text-sm text-muted">Creating...</div>
            </div>
          </div>
        )
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-ink rounded-t-lg border-b border-muted/20">
        <h2 className="text-sm font-display font-semibold text-inkondark">
          Create a new class
        </h2>
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 text-xl leading-none border-none"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-inkondark">
            Class name
          </label>
          <input
            name="className"
            value={form.className}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. BSCS 1-A"
            className="input-well px-3 py-2 text-inkondark transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-inkondark">Subject</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g. Introduction to Programming"
            className="input-well px-3 py-2 text-inkondark transition-all"
          />
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
          disabled={isSubmitting}
        >
          Create class
        </button>
      </div>
    </Modal>
  );
}
