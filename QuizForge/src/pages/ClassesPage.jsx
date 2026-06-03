// src/pages/ClassesPage.jsx

import { useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../components/AuthProvider";
import TopBar from "../components/TopBar";
import ClassesSidebar from "../components/ClassesSidebar";
import StudentInfoModal from "../components/StudentInfoModal";
import { getInitials } from "../util/getInitials";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-[420px] relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-100">
            Create a new class
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none border-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">
              Class name
            </label>
            <input
              name="className"
              value={form.className}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. BSCS 1-A"
              className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Subject</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. Introduction to Programming"
              className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Create class
          </button>
        </div>
      </div>
      {isSubmitting && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin" />
            <div className="text-sm text-white">Creating...</div>
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-[420px] relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-100">
            Add student to {selectedClass?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none border-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">
              Student email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. student@example.com"
              className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
            <div className="min-h-[1.25rem] text-xs">
              {isCheckingEmail && (
                <span className="text-blue-300">Checking email...</span>
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
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin" />
            <div className="text-sm text-white">Adding...</div>
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
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const { authFetch } = useContext(AuthContext);
  const queryClient = useQueryClient();

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
      `${backendHost}/api/classes/${selectedClass?.id}/students`,
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

  const { data: queryClasses, isFetching: queryClassesIsFetching } = useQuery({
    queryKey: ["queryClasses"],
    queryFn: fetchClasses,
    staleTime: 1000 * 60 * 5,
  });

  // ------------------------------------------------------------------------
  // ERROR BOUNDARY
  // ------------------------------------------------------------------------
  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <TopBar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ClassesSidebar
          classes={queryClasses}
          isFetching={queryClassesIsFetching}
          selectedClassId={selectedClass?.id}
          onSelectClass={setSelectedClass}
          setShowCreateModal={setShowCreateModal}
        />

        {/* Student panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedClass ? (
            <>
              {/* Panel header */}
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-100">
                    {selectedClass.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedClass.subject}
                  </p>
                </div>
                <span>
                  <button
                    className="text-xs bg-blue-600 text-gray-100 px-4 py-2 rounded-full hover:bg-blue-700"
                    onClick={() => setShowAddStudentModal(true)}
                  >
                    Add Student
                  </button>
                </span>
              </div>

              {/* Student grid */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-3 content-start">
                {selectedClass.students?.map((student) => (
                  <div
                    key={student?.email}
                    onClick={() => setSelectedStudent(student)}
                    className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-900 bg-opacity-50 flex items-center justify-center text-blue-300 text-xs font-semibold flex-shrink-0">
                      {getInitials(student?.name)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm text-gray-100 font-medium truncate">
                        {student?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {student?.email}
                      </div>
                    </div>
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
                      (student) => student?.email === selectedStudent.email,
                    ),
                  )}
                  onClose={() => setSelectedStudent(null)}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-2">
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
