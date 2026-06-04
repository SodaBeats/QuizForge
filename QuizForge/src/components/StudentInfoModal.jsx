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
      <div
        ref={studentCardRef}
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Student Info</h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              {getInitials(student.name)}
            </div>
            <div>
              <div className="text-lg font-semibold text-white">
                {student.name}
              </div>
              <div className="text-sm text-gray-400">{student.email}</div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Classes
            </div>
            <div className="mt-3 space-y-2">
              {studentClasses?.length > 0 ? (
                studentClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-100"
                  >
                    {classItem.name}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">No classes found</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-800 text-sm text-gray-300 hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
