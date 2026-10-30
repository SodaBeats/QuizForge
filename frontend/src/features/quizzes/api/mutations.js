/* Quiz/question writes (Phase 2.3–2.4). The optimistic handlers that used to
   live inside pages now live here, once, against the shared key factory. */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quizKeys } from "../../../lib/queryKeys.js";
import { quizzesApi } from "./quizzes.api.js";

function snapshotLists(queryClient) {
  return queryClient.getQueriesData({ queryKey: quizKeys.lists });
}

function restoreSnapshots(queryClient, snapshots) {
  snapshots?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

function removeQuizFromListCache(old, quizId) {
  if (Array.isArray(old)) {
    return old.filter((quiz) => quiz.id !== quizId);
  }
  if (old && Array.isArray(old.userQuizzes)) {
    return {
      ...old,
      userQuizzes: old.userQuizzes.filter((quiz) => quiz.id !== quizId),
      totalQuizzes:
        typeof old.totalQuizzes === "number"
          ? Math.max(0, old.totalQuizzes - 1)
          : old.totalQuizzes,
    };
  }
  return old;
}

function replaceQuizInListCache(old, quizToChange) {
  if (Array.isArray(old)) {
    return old.map((quiz) =>
      quiz.id === quizToChange.id ? quizToChange : quiz,
    );
  }
  if (old && Array.isArray(old.userQuizzes)) {
    return {
      ...old,
      userQuizzes: old.userQuizzes.map((quiz) =>
        quiz.id === quizToChange.id ? quizToChange : quiz,
      ),
    };
  }
  return old;
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quiz) => quizzesApi.create(quiz),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quiz) => quizzesApi.update(quiz.id, quiz),
    onMutate: async (quizToChange) => {
      await queryClient.cancelQueries({ queryKey: quizKeys.lists });
      const snapshots = snapshotLists(queryClient);
      queryClient.setQueriesData({ queryKey: quizKeys.lists }, (old) =>
        replaceQuizInListCache(old, quizToChange),
      );
      return { snapshots };
    },
    onError: (_error, _quiz, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId) => quizzesApi.remove(quizId),
    onMutate: async (quizId) => {
      await queryClient.cancelQueries({ queryKey: quizKeys.lists });
      const snapshots = snapshotLists(queryClient);
      queryClient.setQueriesData({ queryKey: quizKeys.lists }, (old) =>
        removeQuizFromListCache(old, quizId),
      );
      return { snapshots };
    },
    onError: (_error, _quizId, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: () => {
      // Also drops the deleted quiz's detail/questions/dashboard caches.
      queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (question) => quizzesApi.createQuestion(question),
    onSuccess: (_data, question) => {
      queryClient.invalidateQueries({
        queryKey: quizKeys.questions(question.quizId),
      });
      // questionCount on the list changed
      queryClient.invalidateQueries({ queryKey: quizKeys.lists });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    // quizId switches between the two PATCH endpoints the app has historically
    // used; the cache shape is the same either way.
    mutationFn: ({ quizId, question }) =>
      quizId
        ? quizzesApi.updateQuizQuestion(quizId, question)
        : quizzesApi.updateQuestion(question),
    onMutate: async ({ quizId, question }) => {
      const queryKey = quizKeys.questions(quizId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      if (previous?.questionList) {
        queryClient.setQueryData(queryKey, (old) => ({
          ...old,
          questionList: old.questionList.map((item) =>
            item.id === question.id ? question : item,
          ),
        }));
      }

      return { queryKey, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: (_data, _error, { quizId }) => {
      queryClient.invalidateQueries({
        queryKey: quizKeys.questions(quizId),
      });
      queryClient.invalidateQueries({ queryKey: quizKeys.lists });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId }) => quizzesApi.deleteQuestion(questionId),
    onMutate: async ({ quizId, questionId }) => {
      const queryKey = quizKeys.questions(quizId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      if (previous?.questionList) {
        queryClient.setQueryData(queryKey, (old) => ({
          ...old,
          questionList: old.questionList.filter(
            (question) => question.id !== questionId,
          ),
        }));
      }

      return { queryKey, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useGenerateQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => quizzesApi.generateQuestions(variables),
    onSuccess: (result, { quizId }) => {
      queryClient.setQueryData(quizKeys.questions(quizId), (previous) => {
        const existing = Array.isArray(previous?.questionList)
          ? previous.questionList
          : [];
        const generated = Array.isArray(result?.questions)
          ? result.questions
          : [];
        return { ...previous, questionList: [...existing, ...generated] };
      });
      queryClient.invalidateQueries({ queryKey: quizKeys.lists });
    },
  });
}
