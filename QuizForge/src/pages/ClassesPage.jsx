// src/pages/ClassesPage.jsx

import { useState, useContext } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import TopBar from "../components/TopBar";
import ClassesSidebar from "../components/ClassesSidebar";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

const MOCK_CLASSES = [
  {
    id: 1,
    name: "BSCS 1-A",
    subject: "CS101",
    students: [
      { id: "2024-0001", name: "Ana Reyes" },
      { id: "2024-0002", name: "Ben Santos" },
      { id: "2024-0003", name: "Cara Lim" },
      { id: "2024-0004", name: "Dan Cruz" },
    ],
  },
  {
    id: 2,
    name: "BSIT 2-B",
    subject: "IT202",
    students: [
      { id: "2023-0011", name: "Gina Tan" },
      { id: "2023-0012", name: "Hans Uy" },
      { id: "2023-0013", name: "Iris Ng" },
    ],
  },
  {
    id: 3,
    name: "BSCS 3-A",
    subject: "CS301",
    students: [
      { id: "2022-0021", name: "Karen Diaz" },
      { id: "2022-0022", name: "Leo Ramos" },
      { id: "2022-0023", name: "Mia Vega" },
    ],
  },
];

// ---------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------
// SUB COMPONENT
// ---------------------------------------------------------------
function CreateClassModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    className: "",
    subject: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.className || !form.subject) {
      toast.error("Incomplete Input");
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-[420px]">
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
              placeholder="e.g. Introduction to Programming"
              className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md"
          >
            Create class
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------------
export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { authFetch } = useContext(AuthContext);

  // submit class creation form
  async function handleCreateClass(form) {
    try {
      const response = await authFetch(`${backendHost}/api/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      if (!response || !response.ok) {
        throw new Error("Failed to create class");
      }
      const result = await response.json();
      if (!result || !result.success) {
        throw new Error(
          `${
            result?.message ||
            result?.errors?.map((e) => e.msg).join(", ") ||
            "Failed to create class"
          }`,
        );
      }
      toast.success("Class Created!");
      console.log(result);
    } catch (error) {
      console.error(`Class creation error: ${error}`);
      toast.error(error.message || "Something went wrong when creating class");
    }
  }

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
          classes={MOCK_CLASSES}
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
                    {selectedClass.students.length} Students
                  </p>
                </div>
                <span>
                  <button className="text-xs bg-blue-900 bg-opacity-40 text-blue-300 px-4 py-2 rounded-full">
                    Add Student
                  </button>
                </span>
              </div>

              {/* Student grid */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-3 content-start">
                {selectedClass.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-900 bg-opacity-50 flex items-center justify-center text-blue-300 text-xs font-semibold flex-shrink-0">
                      {getInitials(student.name)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm text-gray-100 font-medium truncate">
                        {student.name}
                      </div>
                      <div className="text-xs text-gray-500">{student.id}</div>
                    </div>
                  </div>
                ))}
              </div>
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
