/* Class reads (Phase 2.3). One key (`classKeys.list`) is shared by the
   classes page, the quizzes page metadata panel, and the forge-quiz modal. */

import { useQuery } from "@tanstack/react-query";
import { classKeys } from "../../../lib/queryKeys.js";
import { classesApi } from "./classes.api.js";

export function useClasses({ enabled = true } = {}) {
  return useQuery({
    queryKey: classKeys.list,
    queryFn: classesApi.list,
    enabled,
  });
}

/** Debounced-in-the-component email check; errors are validation feedback,
    not a global toast. */
export function useStudentLookup(classId, email, { enabled = true } = {}) {
  return useQuery({
    queryKey: classKeys.studentLookup(classId, email),
    queryFn: () => classesApi.findStudent(classId, email),
    enabled: Boolean(classId) && Boolean(email) && enabled,
    retry: false,
    meta: { skipGlobalError: true },
  });
}
