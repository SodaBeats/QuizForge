// src/features/classes/pages/ClassesPage.jsx

import { useState } from "react";
import toast from "react-hot-toast";
import { TeacherTopbar } from "../../../components/layout/TeacherTopbar";
import { ClassesSidebar } from "../components/ClassesSidebar";
import { ClassStudentsPanel } from "../components/ClassStudentsPanel";
import { CreateClassModal } from "../components/CreateClassModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useClasses } from "../api/queries.js";
import {
  useAddStudent,
  useCreateClass,
  useDeleteClass,
  useRemoveStudent,
} from "../api/mutations.js";

// ------------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------------
export function ClassesPage() {
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
      <TeacherTopbar />

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

        <ClassStudentsPanel
          selectedClass={selectedClass}
          queryClasses={queryClasses}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          showAddStudentModal={showAddStudentModal}
          setShowAddStudentModal={setShowAddStudentModal}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          onAddStudent={handleAddStudent}
          removingIds={removingIds}
          onRemoveStudent={removeStudent}
          mobileTab={mobileTab}
        />
        {showCreateModal && (
          <CreateClassModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateClass}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        )}
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
