import Modal from "./Modal";
import Button from "./Button";

// Shared confirmation dialog (Phase 1.5 / F14 groundwork, adopted by every
// destructive flow in Phase 2.5 — no window.confirm() calls remain).
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <Modal
      onClose={onCancel}
      panelClassName="modal-panel border border-muted p-6 w-96 max-w-full mx-4"
    >
      <h2 className="text-xl font-display font-semibold mb-2 text-inkondark">
        {title}
      </h2>
      <p className="text-sm text-muted mb-6 font-body">{message}</p>
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          className="py-2 text-sm"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button variant="danger" className="py-2 text-sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
