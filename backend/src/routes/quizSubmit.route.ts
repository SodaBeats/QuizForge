import express from 'express';
import { db } from '../db/db.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { getScore } from '../services/getScore.service.js';
import { getShortAnsScoreObject } from '../services/getShortAnsScoreObject.service.js';
import { QuizAttemptsRepo } from '../repository/QuizAttemptsRepository.js';
import { AttemptAnswersRepo } from '../repository/AttemptsAnswersRepo.js';
import type { Question } from '../types/questionType.js';

const router = express.Router();

//QUIZ SUBMIT
//update attempt with score and marked "complete"
router.patch('/', verifyToken, async (req, res, next) => {
  const { questions, answers, quiz, attemptId } = req.body;
  const userId = req.user.id;
  let shortQuestionsAnswers: Record<string, string> = {};

  if (!questions || !answers || !quiz?.id || !attemptId) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }

  // separate short-answer questions to a new array
  const shortAnsQuestions = questions.filter((q: Question) => {
    return q.questionType === 'short-answer';
  });

  // separate 'short-answer' answers and delete from 'answers'
  for (const q of shortAnsQuestions) {
    shortQuestionsAnswers[q.id.toString()] = answers[q.id] ?? '';
    delete answers[q.id];
  }

  // separate normal questions to a new array
  const normalQuestions = questions.filter((q: Question) => {
    return q.questionType !== 'short-answer';
  });

  // get total score for 'multiple-choice' and 'true-false' questions
  const normalQuestionsScore = await getScore(normalQuestions, answers);
  // get score array for 'short-answer' questions
  const shortAnsQuestionsScoreObject: Record<string, number> =
    await getShortAnsScoreObject(shortAnsQuestions, shortQuestionsAnswers);

  // get total score for 'short-answer' questions
  const shortAnsQuestionsRawScore = Object.values(
    shortAnsQuestionsScoreObject,
  ).reduce((sum, val) => {
    const numericVal = typeof val === 'number' ? val : 0;
    return sum + numericVal;
  }, 0);

  //console.log(`[shortAnsQuestions]:`, shortAnsQuestions);
  //console.log(`[shortQuestionsAnswers]:`, shortQuestionsAnswers);
  //console.log(`[shortAnsQuestionsScoreObject]: `, shortAnsQuestionsScoreObject);

  // calculate max possible score based on question point
  // (multiple-choice, true-false = 1 pt)
  // (short-answer = 10 pts)
  const maxPossibleScore =
    normalQuestions.length * 1 + shortAnsQuestions.length * 10;
  const rawScore = normalQuestionsScore + shortAnsQuestionsRawScore;
  const percentileScore =
    maxPossibleScore > 0 ? Math.floor((rawScore / maxPossibleScore) * 100) : 0;

  const formattedData = {
    score: percentileScore,
    status: 'completed',
    raw_score: rawScore,
    max_possible_score: maxPossibleScore,
  };

  const formattedAttemptAnswers = normalQuestions.map((q: Question) => {
    return {
      quiz_id: quiz.id,
      attempt_id: attemptId,
      user_id: userId,
      question_id: q.id,
      chosen_answer: answers[q.id] ?? null,
      correct_answer: q.correctAnswer,
      is_correct: (answers[q.id] ?? null) === q.correctAnswer,
    };
  });

  const formattedShortAnsAttemptAnswers = shortAnsQuestions.map(
    (q: Question) => {
      const score = shortAnsQuestionsScoreObject[q.id.toString()] ?? 0;
      return {
        quiz_id: quiz.id,
        attempt_id: attemptId,
        user_id: userId,
        question_id: q.id,
        chosen_answer: shortQuestionsAnswers[q.id.toString()] ?? null,
        correct_answer: q.correctAnswer,
        is_correct: score >= 7,
      };
    },
  );

  try {
    await db.transaction(async (tx) => {
      await QuizAttemptsRepo.updateAttempt(
        formattedData,
        quiz.id,
        attemptId,
        userId,
        tx,
      );
      await AttemptAnswersRepo.insertAttemptAnswer(formattedAttemptAnswers, tx);
      await AttemptAnswersRepo.insertAttemptAnswer(
        formattedShortAnsAttemptAnswers,
        tx,
      );
    });
    return res
      .status(200)
      .json({ success: true, message: 'Attempt received!' });
  } catch (error) {
    return next(error);
  }
});

export default router;
