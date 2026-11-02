// src/features/classes/pages/ClassesPage.jsx

import { useState } from "react";
import toast from "react-hot-toast";
import { AppShell } from "../../../components/layout/AppShell";
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
    <AppShell
      tabs={
        selectedClass
          ? [
              { key: "classes", label: "Classes" },
              { key: "students", label: "Students" },
            ]
          : [] // no selection → no switcher (matches the old conditional strip)
      }
      activeTab={mobileTab}
      onChange={setMobileTab}
      panels={[
        {
          key: "classes",
          visible: !selectedClass || mobileTab === "classes",
          children: (
            <ClassesSidebar
              classes={queryClasses}
              isFetching={queryClassesIsFetching}
              selectedClassId={selectedClassId}
              onSelectClass={setSelectedClassId}
              setShowCreateModal={setShowCreateModal}
              onDeleteClass={handleDeleteClass}
              deletingIds={deletingIds}
            />
          ),
        },
      ]}
    >
      {/* Self-managed visibility (hidden lg:flex) — stays a direct container child */}
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
    </AppShell>
  );
}
