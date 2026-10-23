import { getInitials } from "../../util/getInitials";
import Modal from "../ui/Modal";

export default function StudentInfoModal({ student, studentClasses, onClose }) {
  return (
    <Modal
      onClose={onClose}
      overlayClassName="px-4 py-6"
      panelClassName="bg-specialsurface rounded-lg max-w-xl w-full overflow-hidden border border-muted font-body"
    >
      <div className="flex items-center justify-between px-6 py-5 bg-ink border-b border-muted/20">
        <h2 className="text-lg font-display font-semibold text-inkondark">
          Student info
        </h2>
      </div>

      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-bold flex-shrink-0 text-ink bg-white">
            {getInitials(student.name)}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-display font-semibold text-inkondark truncate">
              {student.name}
            </div>
            <div className="text-sm text-muted truncate">{student.email}</div>
          </div>
        </div>

        <div className="rounded-lg bg-darkslate p-4 border border-muted/30">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">
            Classes
          </div>
          <div className="mt-3 space-y-2">
            {studentClasses?.length > 0 ? (
              studentClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="rounded-md bg-surface px-3 py-2 text-sm text-inkondark border border-muted/20"
                >
                  {classItem.name}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted">No classes found</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-muted/20">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md text-sm font-medium text-inkondark transition-all bg-surface hover:bg-muted/20 border border-muted/30"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
