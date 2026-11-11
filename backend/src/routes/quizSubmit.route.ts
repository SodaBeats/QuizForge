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
    const userId = req.user.id;
    let reasoningQuestionsAnswers: Record<string, string> = {};
    let attemptRemarks = 'Summary Unavailable';

    if (!questions || !answers || !quiz?.id || !attemptId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // separate reasoning questions (LLM-graded 0-10) to a new array
    const reasoningQuestions = questions.filter((q: Question) => {
      return isReasoningQuestionType(q.questionType);
    });

    // separate 'reasoning' answers and delete from 'answers'
    for (const q of reasoningQuestions) {
      reasoningQuestionsAnswers[q.id.toString()] = answers[q.id] ?? '';
      delete answers[q.id];
    }

    // separate normal (exact-match, 1 pt) questions to a new array
    const normalQuestions = questions.filter((q: Question) => {
      return !isReasoningQuestionType(q.questionType);
    });

    // get total score for 'multiple-choice' and 'true-false' questions
    const normalQuestionsScore = getScore(normalQuestions, answers);

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
        quiz_id: quiz.id,
        attempt_id: attemptId,
        user_id: userId,
        question_id: q.id,
        chosen_answer: answers[q.id] ?? null,
        correct_answer: q.correctAnswer,
        is_correct: (answers[q.id] ?? null) === q.correctAnswer,
        points: (answers[q.id] ?? null) === q.correctAnswer ? 1 : 0,
      };
    });

    const formattedReasoningAttemptAnswers = reasoningQuestions.map(
      (q: Question) => {
        const score = reasoningQuestionsScoreObject.scores[q.id.toString()] ?? 0;
        const remarks =
          reasoningQuestionsScoreObject.remarks[q.id.toString()] ?? null;
        return {
          quiz_id: quiz.id,
          attempt_id: attemptId,
          user_id: userId,
          question_id: q.id,
          chosen_answer: reasoningQuestionsAnswers[q.id.toString()] ?? null,
          correct_answer: q.correctAnswer,
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
          quiz.id,
          attemptId,
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
