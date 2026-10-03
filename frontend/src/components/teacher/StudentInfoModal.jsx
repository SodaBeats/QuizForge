import { useRef, useEffect } from "react";
import { getInitials } from "../../util/getInitials";

export default function StudentInfoModal({ student, studentClasses, onClose }) {
  const studentCardRef = useRef(null);

  // closes modal when clicking away from student card
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        studentCardRef.current &&
        !studentCardRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // eslint-disable-line

  return (
    <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50 px-4 py-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>
      <div
        ref={studentCardRef}
        className="bg-canvas rounded-lg max-w-xl w-full overflow-hidden border border-accent font-body"
      >
        <div className="flex items-center justify-between px-6 py-5 bg-surface">
          <h2 className="text-lg font-display font-semibold text-inkondark">
            Student info
          </h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-bold flex-shrink-0 text-accent"
              style={{
                background: "var(--surface)",
              }}
            >
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

        <div className="flex justify-end gap-3 px-6 py-4 bg-surface">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-inkondark transition-all bg-surface hover:bg-muted/20 border border-muted/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
