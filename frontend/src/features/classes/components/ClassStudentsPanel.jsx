import { getInitials } from "../../../util/getInitials";
import { AddStudentModal } from "./AddStudentModal";
import { StudentInfoModal } from "./StudentInfoModal";

export function ClassStudentsPanel({
  selectedClass,
  queryClasses,
  selectedStudent,
  setSelectedStudent,
  showAddStudentModal,
  setShowAddStudentModal,
  isSubmitting,
  setIsSubmitting,
  onAddStudent,
  removingIds,
  onRemoveStudent,
  mobileTab,
}) {
  return (
    <div
      className={`${
        selectedClass && mobileTab !== "students" ? "hidden lg:flex" : "flex"
      } flex-1 flex-col overflow-hidden font-body p-3`}
    >
      {selectedClass ? (
        <>
          <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-accent">
            <div className="px-4 sm:px-6 py-4 bg-specialsurface flex items-center justify-between gap-3 border-b border-muted/20">
              <div className="min-w-0">
                <h2 className="text-base font-display font-semibold text-inkondark truncate">
                  {selectedClass.name}
                </h2>
                <p className="text-xs text-muted truncate">
                  {selectedClass.subject}
                </p>
              </div>
              <span className="flex-shrink-0">
                <button
                  className="text-xs font-display font-bold bg-accept text-inkondark hover:bg-green-600 px-4 py-2 rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0.5"
                  onClick={() => setShowAddStudentModal(true)}
                >
                  Add student
                </button>
              </span>
            </div>

            <div className="themed-scroll flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
              {selectedClass.students?.map((student) => (
                <div
                  key={student?.id}
                  className="flex items-center justify-between rounded-md px-4 py-3 transition-all bg-darkslate hover:bg-darkslate/70 border border-muted/20"
                >
                  <div
                    onClick={() => setSelectedStudent(student)}
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-ccdiblue text-xs font-display font-semibold flex-shrink-0">
                      {getInitials(student?.name)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm text-inkondark font-medium truncate">
                        {student?.name}
                      </div>
                      <div className="text-xs text-muted truncate">
                        {student?.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveStudent(selectedClass.id, student.id);
                    }}
                    disabled={removingIds.includes(student.id)}
                    className={`ml-3 text-red-400 hover:text-red-500 px-2 py-1 rounded-md flex-shrink-0 ${
                      removingIds.includes(student.id)
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {showAddStudentModal && (
            <AddStudentModal
              selectedClass={selectedClass}
              onClose={() => setShowAddStudentModal(false)}
              onSubmit={onAddStudent}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
            />
          )}

          {selectedStudent && (
            <StudentInfoModal
              student={selectedStudent}
              studentClasses={queryClasses?.filter((classItem) =>
                classItem.students?.some(
                  (student) => student?.id === selectedStudent.id,
                ),
              )}
              onClose={() => setSelectedStudent(null)}
            />
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-surface text-muted gap-2 border border-accent">
          <span className="text-3xl">👥</span>
          <p className="text-sm">Select a class to view students</p>
        </div>
      )}
    </div>
  );
}
