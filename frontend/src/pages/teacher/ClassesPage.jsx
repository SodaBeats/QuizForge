// src/pages/ClassesPage.jsx

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import TopBar from "../../components/teacher/TopBar";
import ClassesSidebar from "../../components/teacher/ClassesSidebar";
import StudentInfoModal from "../../components/teacher/StudentInfoModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { getInitials } from "../../util/getInitials";
import { useClasses, useStudentLookup } from "../../features/classes/api/queries.js";
import {
  useAddStudent,
  useCreateClass,
  useDeleteClass,
  useRemoveStudent,
} from "../../features/classes/api/mutations.js";

import Modal from "../../components/ui/Modal";

// ---------------------------------------------------------------
// SUB COMPONENT
// ---------------------------------------------------------------
function CreateClassModal({
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

function AddStudentModal({
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
// ------------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------------
export default function ClassesPage() {
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [removingIds, setRemovingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [mobileTab, setMobileTab] = useState("classes"); // mobile-only panel switcher — purely UI state, no data logic

  const { data: queryClasses, isFetching: queryClassesIsFetching } = useClasses();

  const createClass = useCreateClass();
  const addStudent = useAddStudent();
  const removeStudentMutation = useRemoveStudent();
  const deleteClassMutation = useDeleteClass();

  // handler for creating a class
  async function handleCreateClass(form) {
    await createClass.mutateAsync(form);
  }

  // handler for adding student to class
  async function handleAddStudent(form) {
    await addStudent.mutateAsync({ classId: selectedClassId, form });
  }

  // handler for removing student from class
  function removeStudent(classId, studentId) {
    setStudentToRemove({ classId, studentId });
  }

  function confirmRemoveStudent() {
    if (!studentToRemove) return;

    const { classId, studentId } = studentToRemove;

    // close modal if the deleted student is currently selected
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(null);
    }

    setRemovingIds((prev) => [...prev, studentId]);

    removeStudentMutation.mutate(
      { classId, studentId },
      {
        onSuccess: () => toast.success("Student removed"),
        onSettled: () => {
          setRemovingIds((prev) => prev.filter((id) => id !== studentId));
        },
      },
    );

    setStudentToRemove(null);
  }

  // handler for deleting a class
  function handleDeleteClass(classItem) {
    setClassToDelete(classItem);
  }

  function confirmDeleteClass() {
    if (!classToDelete) return;

    const classId = classToDelete.id;
    const previousSelectedClassId = selectedClassId;

    // deselect class if it was selected
    if (selectedClassId === classId) {
      setSelectedClassId(null);
    }

    setDeletingIds((prev) => [...prev, classId]);

    deleteClassMutation.mutate(classId, {
      onSuccess: () => toast.success("Class deleted successfully"),
      onError: () => {
        // Only restore a selection that this delete actually cleared.
        if (previousSelectedClassId === classId) {
          setSelectedClassId(classId);
        }
      },
      onSettled: () => {
        setDeletingIds((prev) => prev.filter((id) => id !== classId));
      },
    });

    setClassToDelete(null);
  }

  // derive selected class from query data to keep it in sync
  const selectedClass = queryClasses?.find((c) => c.id === selectedClassId);

  return (
    <div className="h-screen flex flex-col bg-canvas text-inkondark">
      <TopBar />

      {/* Mobile/tablet panel switcher — only relevant once a class is selected, hidden on desktop */}
      {selectedClass && (
        <div className="flex lg:hidden mx-3 mt-3 rounded-lg bg-surface border border-muted/20 font-body overflow-hidden">
          {[
            { key: "classes", label: "Classes" },
            { key: "students", label: "Students" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                mobileTab === tab.key
                  ? "text-accent"
                  : "text-muted hover:text-inkondark"
              }`}
            >
              {tab.label}
              {mobileTab === tab.key && (
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-accent" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            !selectedClass || mobileTab === "classes" ? "flex" : "hidden"
          } lg:contents`}
        >
          <ClassesSidebar
            classes={queryClasses}
            isFetching={queryClassesIsFetching}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            setShowCreateModal={setShowCreateModal}
            onDeleteClass={handleDeleteClass}
            deletingIds={deletingIds}
          />
        </div>

        {/* Student panel */}
        <div
          className={`${
            selectedClass && mobileTab !== "students"
              ? "hidden lg:flex"
              : "flex"
          } flex-1 flex-col overflow-hidden font-body p-3`}
        >
          {selectedClass ? (
            <>
              <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-accent">
                {/* Panel header */}
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

                {/* Student grid */}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStudent(selectedClass.id, student.id);
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

              {/* Modals live OUTSIDE the card */}
              {showAddStudentModal && (
                <AddStudentModal
                  selectedClass={selectedClass}
                  onClose={() => setShowAddStudentModal(false)}
                  onSubmit={handleAddStudent}
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
          {showCreateModal && (
            <CreateClassModal
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateClass}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(studentToRemove)}
        title="Remove student?"
        message="Remove this student from the class?"
        confirmLabel="Remove student"
        onConfirm={confirmRemoveStudent}
        onCancel={() => setStudentToRemove(null)}
      />

      <ConfirmDialog
        open={Boolean(classToDelete)}
        title="Delete class?"
        message={
          classToDelete
            ? `Delete class '${classToDelete.name}'? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete class"
        onConfirm={confirmDeleteClass}
        onCancel={() => setClassToDelete(null)}
      />
    </div>
  );
}
