import express from 'express';
import { db } from '../db/db.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { getScore } from '../services/getScore.service.js';
import {
  getReasoningScoreObject,
  type ReasoningGradingResult,
} from '../services/getReasoningScoreObject.service.js';
import { QuizAttemptsRepo } from '../repository/QuizAttemptsRepository.js';
import { AttemptAnswersRepo } from '../repository/AttemptsAnswersRepo.js';
import { QuestionsRepository } from '../repository/QuestionsRepository.js';
import { UserQuizzesRepository } from '../repository/UserQuizzesRepository.js';
import type { Question } from '../types/questionType.js';
import { isReasoningQuestionType } from '../types/questionType.js';
import { getSummaryRemarks } from '../services/summaryRemarks.service.js';

const router = express.Router();

//QUIZ SUBMIT
//update attempt with score and marked "complete"
router.patch(
  '/',
  verifyToken,
  userBasedRateLimiter(3, 1),
  async (req, res, next) => {
    const { questions, answers, quiz, attemptId } = req.body;
    const userId = Number(req.user.id);
    let reasoningQuestionsAnswers: Record<string, string> = {};
    let attemptRemarks = 'Summary Unavailable';

    if (!questions || !answers || !quiz?.id || !attemptId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    if (!Array.isArray(questions) || typeof answers !== 'object') {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid submission payload' });
    }

    const quizId = Number(quiz.id);
    const numericAttemptId = Number(attemptId);
    if (
      !Number.isInteger(quizId) ||
      !Number.isInteger(numericAttemptId) ||
      quizId <= 0 ||
      numericAttemptId <= 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid submission payload' });
    }

    const liveQuiz = await UserQuizzesRepository.getQuizById(quizId);
    if (!liveQuiz) {
      return res
        .status(404)
        .json({ success: false, message: 'Quiz not found' });
    }
    if (liveQuiz.status !== 'published') {
      return res
        .status(400)
        .json({ success: false, message: 'Quiz is not accepting submissions' });
    }
    if (Date.now() > new Date(liveQuiz.due_date).getTime()) {
      return res
        .status(400)
        .json({ success: false, message: 'Quiz is past the deadline' });
    }

    const liveQuestions =
      await QuestionsRepository.getQuestionsRelatedToQuiz(quizId);
    if (!liveQuestions || liveQuestions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Quiz has no questions' });
    }

    const submittedQuestionIds = questions
      .map((question: Question) => Number(question?.id))
      .filter((id: number) => Number.isInteger(id));
    const liveQuestionIds = liveQuestions.map((question) => question.id);
    const liveQuestionIdSet = new Set(liveQuestionIds);
    const submittedQuestionIdSet = new Set(submittedQuestionIds);
    const submittedExactQuestionSet =
      submittedQuestionIds.length === liveQuestionIds.length &&
      submittedQuestionIdSet.size === liveQuestionIdSet.size &&
      [...submittedQuestionIdSet].every((id) => liveQuestionIdSet.has(id));

    if (!submittedExactQuestionSet) {
      return res.status(400).json({
        success: false,
        message: 'Submitted questions do not belong to this quiz',
      });
    }

    const safeQuestions: Question[] = liveQuestions.map((question) => ({
      id: question.id,
      quizId: question.quizId,
      questionText: question.questionText,
      questionType: question.questionType as Question['questionType'],
      timeLimit: question.timeLimit ?? 0,
      correctAnswer: question.correctAnswer ?? null,
      optionA: question.optionA ?? null,
      optionB: question.optionB ?? null,
      optionC: question.optionC ?? null,
      optionD: question.optionD ?? null,
    }));
    const safeAnswers = { ...answers };

    // separate reasoning questions (LLM-graded 0-10) to a new array
    const reasoningQuestions = safeQuestions.filter((q: Question) => {
      return isReasoningQuestionType(q.questionType);
    });

    // separate 'reasoning' answers and delete from 'answers'
    for (const q of reasoningQuestions) {
      reasoningQuestionsAnswers[q.id.toString()] =
        safeAnswers[q.id.toString()] ?? '';
      delete safeAnswers[q.id.toString()];
    }

    // separate normal (exact-match, 1 pt) questions to a new array
    const normalQuestions = safeQuestions.filter((q: Question) => {
      return !isReasoningQuestionType(q.questionType);
    });

    // get total score for 'multiple-choice' and 'true-false' questions
    const normalQuestionsScore = getScore(
      normalQuestions.map((question) => ({
        ...question,
        correctAnswer: question.correctAnswer ?? null,
      })),
      safeAnswers,
    );

    // get score array for 'reasoning' questions
    let reasoningQuestionsScoreObject: ReasoningGradingResult = {
      scores: {},
      remarks: {},
    };

    if (reasoningQuestions.length > 0) {
      try {
        reasoningQuestionsScoreObject = await getReasoningScoreObject(
          reasoningQuestions, // array of question objects
          reasoningQuestionsAnswers, // object with key value pair of question id and answer
        );
      } catch (error: any) {
        console.error(
          '[quizSubmit.route] Reasoning grading failed:',
          error.message,
        );

        return res.status(500).json({
          success: false,
          message: 'Failed to grade open-ended questions. Please try again.',
        });
      }
    }

    // get total score for 'reasoning' questions
    const reasoningQuestionsRawScore = Object.values(
      reasoningQuestionsScoreObject.scores,
    ).reduce((sum, val) => {
      const numericVal = typeof val === 'number' ? val : 0;
      return sum + numericVal;
    }, 0);

    // calculate max possible score based on question point
    // (multiple-choice, true-false = 1 pt)
    // (reasoning types = 10 pts)
    const maxPossibleScore =
      normalQuestions.length * 1 + reasoningQuestions.length * 10;
    const rawScore = normalQuestionsScore + reasoningQuestionsRawScore;
    const percentileScore =
      maxPossibleScore > 0
        ? Math.floor((rawScore / maxPossibleScore) * 100)
        : 0;

    const formattedAttemptAnswers = normalQuestions.map((q: Question) => {
      return {
        quiz_id: quizId,
        attempt_id: numericAttemptId,
        user_id: userId,
        question_id: q.id,
        chosen_answer: safeAnswers[q.id.toString()] ?? null,
        correct_answer: q.correctAnswer ?? '',
        is_correct:
          (safeAnswers[q.id.toString()] ?? null) === q.correctAnswer,
        points:
          (safeAnswers[q.id.toString()] ?? null) === q.correctAnswer ? 1 : 0,
      };
    });

    const formattedReasoningAttemptAnswers = reasoningQuestions.map(
      (q: Question) => {
        const score = reasoningQuestionsScoreObject.scores[q.id.toString()] ?? 0;
        const remarks =
          reasoningQuestionsScoreObject.remarks[q.id.toString()] ?? null;
        return {
          quiz_id: quizId,
          attempt_id: numericAttemptId,
          user_id: userId,
          question_id: q.id,
          chosen_answer: reasoningQuestionsAnswers[q.id.toString()] ?? null,
          correct_answer: q.correctAnswer ?? '',
          is_correct: score >= 7,
          remarks,
          points: score,
        };
      },
    );

    try {
      attemptRemarks = await getSummaryRemarks({
        formattedAttemptAnswers,
        formattedReasoningAttemptAnswers,
        normalQuestions,
        reasoningQuestions,
      });
    } catch (error: any) {
      console.error(
        '[quizSubmit.route] Summary generation failed: ',
        error.message || error,
      );
    }

    const formattedData = {
      score: percentileScore,
      status: 'completed',
      raw_score: rawScore,
      max_possible_score: maxPossibleScore,
      attempt_remarks: attemptRemarks,
    };

    try {
      await db.transaction(async (tx) => {
        await QuizAttemptsRepo.updateAttempt(
          formattedData,
          quizId,
          numericAttemptId,
          userId,
          tx,
        );
        await AttemptAnswersRepo.insertAttemptAnswer(
          formattedAttemptAnswers,
          tx,
        );
        await AttemptAnswersRepo.insertAttemptAnswer(
          formattedReasoningAttemptAnswers,
          tx,
        );
      });
      return res
        .status(200)
        .json({ success: true, message: 'Attempt received!' });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
