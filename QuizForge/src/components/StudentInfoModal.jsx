import { useRef, useEffect } from "react";
import { getInitials } from "../util/getInitials";

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4 py-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>
      <div
        ref={studentCardRef}
        className="bg-[#322b23] rounded-3xl max-w-xl w-full overflow-hidden shadow-[14px_14px_28px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(255,255,255,0.04)] font-body"
      >
        <div className="flex items-center justify-between px-6 py-5 bg-[#3a3128]">
          <h2 className="text-lg font-display font-semibold text-[#e8ddce]">
            Student info
          </h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-bold flex-shrink-0 text-[#ffb27a]"
              style={{
                background: "#3a2a1c",
                boxShadow:
                  "inset 2px 2px 4px rgba(255,255,255,0.08), inset -3px -3px 6px rgba(0,0,0,0.35)",
              }}
            >
              {getInitials(student.name)}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-display font-semibold text-[#e8ddce] truncate">
                {student.name}
              </div>
              <div className="text-sm text-[#766a59] truncate">
                {student.email}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#26211c] p-4 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-3px_-3px_7px_rgba(255,255,255,0.04)]">
            <div className="text-xs uppercase tracking-[0.2em] text-[#766a59]">
              Classes
            </div>
            <div className="mt-3 space-y-2">
              {studentClasses?.length > 0 ? (
                studentClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="rounded-xl bg-[#322b23] px-3 py-2 text-sm text-[#cabaa2] shadow-[6px_6px_14px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.02)]"
                  >
                    {classItem.name}
                  </div>
                ))
              ) : (
                <div className="text-sm text-[#6b5f52]">No classes found</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-[#3a3128]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium text-[#cabaa2] hover:text-[#e8ddce] transition-all bg-[#26211c] hover:bg-[#3a3128]/60 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
