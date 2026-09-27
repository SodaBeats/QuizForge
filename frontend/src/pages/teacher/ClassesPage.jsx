// src/pages/ClassesPage.jsx

import { useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../../components/AuthProvider";
import TopBar from "../../components/teacher/TopBar";
import ClassesSidebar from "../../components/teacher/ClassesSidebar";
import StudentInfoModal from "../../components/teacher/StudentInfoModal";
import { getInitials } from "../../util/getInitials";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

// shared flat styling tokens - cosmetic only, referenced by className below
const wellInputClass =
  "bg-surface rounded-md px-3 py-2 text-sm text-ink placeholder-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all";
const modalPanelClass =
  "bg-surface rounded-lg w-[420px] max-w-full relative font-body border border-muted/20";
const primaryBtnClass =
  "px-4 py-2 text-sm bg-accent text-canvas font-display font-bold rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0.5";
const secondaryBtnClass =
  "px-4 py-2 text-sm text-ink rounded-md transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-surface hover:bg-muted/10 border border-muted/30";

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
      toast.error(error.message || "Something went wrong while creating class");
    }
  };

  return (
    <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50 px-4">
      <div className={modalPanelClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-surface rounded-t-lg">
          <h2 className="text-sm font-display font-semibold text-ink">
            Create a new class
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none border-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">
              Class name
            </label>
            <input
              name="className"
              value={form.className}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. BSCS 1-A"
              className={wellInputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. Introduction to Programming"
              className={wellInputClass}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            onClick={onClose}
            className={secondaryBtnClass}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={primaryBtnClass}
            disabled={isSubmitting}
          >
            Create class
          </button>
        </div>
      </div>
      {isSubmitting && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-canvas/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-t-transparent border-accent rounded-full animate-spin" />
            <div className="text-sm text-ink">Creating...</div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddStudentModal({
  selectedClass,
  onClose,
  onSubmit,
  isSubmitting,
  setIsSubmitting,
}) {
  const { authFetch } = useContext(AuthContext);
  const [form, setForm] = useState({
    email: "",
  });
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState("");
  const [emailValid, setEmailValid] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setEmailCheckError("");
    setEmailValid(null);
  };

  // email verification for adding student to class (debounced)
  useEffect(() => {
    if (!form.email) {
      setEmailCheckError("");
      setEmailValid(null);
      setIsCheckingEmail(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      setEmailCheckError("");
      setEmailValid(null);

      try {
        const response = await authFetch(
          `${backendHost}/api/classes/${selectedClass?.id}/students/find?email=${encodeURIComponent(
            form.email,
          )}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          const result = await response.json();
          const errorMessage =
            result?.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "Email validation failed";
          setEmailValid(false);
          setEmailCheckError(errorMessage);
          return;
        }
        setEmailValid(true);
      } catch (error) {
        setEmailValid(false);
        setEmailCheckError(error.message || "Unable to validate email");
      } finally {
        setIsCheckingEmail(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [form.email, authFetch, selectedClass?.id]);

  const handleSubmit = async () => {
    if (!form.email) {
      toast.error("Please enter an email");
      return;
    }
    if (isCheckingEmail) {
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
      toast.error(error.message || "Something went wrong while adding student");
    }
  };

  return (
    <div className="fixed inset-0 bg-canvas/70 flex items-center justify-center z-50 px-4">
      <div className={modalPanelClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-surface rounded-t-lg">
          <h2 className="text-sm font-display font-semibold text-ink truncate pr-2">
            Add student to {selectedClass?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none border-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">
              Student email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. student@example.com"
              className={wellInputClass}
            />
            <div className="min-h-[1.25rem] text-xs">
              {isCheckingEmail && (
                <span className="text-accent">Checking email...</span>
              )}
              {!isCheckingEmail && emailCheckError && (
                <span className="text-red-400">{emailCheckError}</span>
              )}
              {!isCheckingEmail && emailValid && (
                <span className="text-green-400">User exists</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            onClick={onClose}
            className={secondaryBtnClass}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={primaryBtnClass}
            disabled={
              isSubmitting ||
              isCheckingEmail ||
              !!emailCheckError ||
              !emailValid
            }
          >
            Add student
          </button>
        </div>
      </div>
      {isSubmitting && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-canvas/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-t-transparent border-accent rounded-full animate-spin" />
            <div className="text-sm text-ink">Adding...</div>
          </div>
        </div>
      )}
    </div>
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
  const { authFetch } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [removingIds, setRemovingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [mobileTab, setMobileTab] = useState("classes"); // mobile-only panel switcher — purely UI state, no data logic

  // handler for creating a class
  async function handleCreateClass(form) {
    const response = await authFetch(`${backendHost}/api/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.errors?.map((e) => e.msg).join(", ") ||
          errorData?.message ||
          "Failed to create class",
      );
    }
    await queryClient.invalidateQueries({ queryKey: ["queryClasses"] });
  }

  async function fetchClasses() {
    const response = await authFetch(`${backendHost}/api/classes`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.errors?.map((e) => e.msg).join(", ") ||
          errorData?.message ||
          "Failed to fetch class",
      );
    }
    const result = await response.json();
    return result.classArray;
  }

  // handler for adding student to class
  async function handleAddStudent(form) {
    const response = await authFetch(
      `${backendHost}/api/classes/${selectedClassId}/students`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData?.errors?.map((e) => e.msg).join(", ") ||
          errorData?.message ||
          "Failed to add student",
      );
    }

    await queryClient.invalidateQueries({ queryKey: ["queryClasses"] });
  }

  // handler for removing student from class
  async function removeStudent(classId, studentId) {
    if (!window.confirm("Remove this student from the class?")) return;

    const snapshot = queryClient.getQueryData(["queryClasses"]);

    // optimistic update: remove student locally
    queryClient.setQueryData(["queryClasses"], (old) => {
      if (!old) return old;
      return old.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          students: c.students?.filter((s) => s.id !== studentId),
        };
      });
    });

    // close modal if the deleted student is currently selected
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(null);
    }

    setRemovingIds((prev) => [...prev, studentId]);

    try {
      const response = await authFetch(
        `${backendHost}/api/classes/${classId}/students/${studentId}`,
        { method: "DELETE", credentials: "include" },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "Failed to remove student");
      }

      toast.success("Student removed");
      await queryClient.invalidateQueries({ queryKey: ["queryClasses"] });
    } catch (err) {
      // rollback
      queryClient.setQueryData(["queryClasses"], snapshot);
      toast.error(err.message || "Unable to remove student");
    } finally {
      setRemovingIds((prev) => prev.filter((id) => id !== studentId));
    }
  }

  // handler for deleting a class
  async function handleDeleteClass(classToDelete) {
    const confirmMessage = `Delete class '${classToDelete.name}'? This cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    const snapshot = queryClient.getQueryData(["queryClasses"]);

    // optimistic update: remove class locally
    queryClient.setQueryData(["queryClasses"], (old) => {
      if (!old) return old;
      return old.filter((c) => c.id !== classToDelete.id);
    });

    // deselect class if it was selected
    if (selectedClassId === classToDelete.id) {
      setSelectedClassId(null);
    }

    setDeletingIds((prev) => [...prev, classToDelete.id]);

    try {
      const response = await authFetch(
        `${backendHost}/api/classes/${classToDelete.id}`,
        { method: "DELETE", credentials: "include" },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "Failed to delete class");
      }

      toast.success("Class deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["queryClasses"] });
    } catch (err) {
      // rollback
      queryClient.setQueryData(["queryClasses"], snapshot);
      if (
        selectedClassId === null &&
        snapshot?.some((c) => c.id === classToDelete.id)
      ) {
        setSelectedClassId(classToDelete.id);
      }
      toast.error(err.message || "Failed to delete class");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== classToDelete.id));
    }
  }

  const { data: queryClasses, isFetching: queryClassesIsFetching } = useQuery({
    queryKey: ["queryClasses"],
    queryFn: fetchClasses,
    staleTime: 1000 * 60 * 5,
  });

  // derive selected class from query data to keep it in sync
  const selectedClass = queryClasses?.find((c) => c.id === selectedClassId);

  // ------------------------------------------------------------------------
  // ERROR BOUNDARY
  // ------------------------------------------------------------------------
  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }
  return (
    <div className="h-screen flex flex-col bg-canvas text-ink">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

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
                  : "text-muted hover:text-ink"
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
            <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
              {/* Panel header */}
              <div className="px-4 sm:px-6 py-4 bg-surface flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-display font-semibold text-ink truncate">
                    {selectedClass.name}
                  </h2>
                  <p className="text-xs text-muted truncate">
                    {selectedClass.subject}
                  </p>
                </div>
                <span className="flex-shrink-0">
                  <button
                    className="text-xs font-display font-bold bg-accent text-canvas px-4 py-2 rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0.5"
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
                    className="flex items-center justify-between rounded-md px-4 py-3 transition-all bg-surface hover:bg-muted/10 border border-muted/20"
                  >
                    <div
                      onClick={() => setSelectedStudent(student)}
                      className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-accent text-xs font-display font-semibold flex-shrink-0">
                        {getInitials(student?.name)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm text-ink font-medium truncate">
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

              {/* Add student modal */}
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
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-surface text-muted gap-2 border border-muted/20">
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
    </div>
  );
}
