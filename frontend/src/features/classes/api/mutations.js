/* Class writes (Phase 2.3–2.4). */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { classKeys } from "../../../lib/queryKeys.js";
import { classesApi } from "./classes.api.js";

function removeStudentFromCache(old, { classId, studentId }) {
  if (!Array.isArray(old)) return old;
  return old.map((classItem) => {
    if (classItem.id !== classId) return classItem;
    return {
      ...classItem,
      students: classItem.students?.filter(
        (student) => student.id !== studentId,
      ),
    };
  });
}

function removeClassFromCache(old, classId) {
  if (!Array.isArray(old)) return old;
  return old.filter((classItem) => classItem.id !== classId);
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form) => classesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useAddStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, form }) => classesApi.addStudent(classId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useRemoveStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }) =>
      classesApi.removeStudent(classId, studentId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: classKeys.list });
      const previous = queryClient.getQueryData(classKeys.list);
      queryClient.setQueryData(classKeys.list, (old) =>
        removeStudentFromCache(old, variables),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(classKeys.list, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId) => classesApi.remove(classId),
    onMutate: async (classId) => {
      await queryClient.cancelQueries({ queryKey: classKeys.list });
      const previous = queryClient.getQueryData(classKeys.list);
      queryClient.setQueryData(classKeys.list, (old) =>
        removeClassFromCache(old, classId),
      );
      return { previous };
    },
    onError: (_error, _classId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(classKeys.list, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
