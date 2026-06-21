import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { type Quiz, Accessibility } from '../types/quizType.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { quizInputValidator } from '../middlewares/quizInputValidator.middleware.js';
import { questionInputValidator } from '../middlewares/questionValidator.middleware.js';
import { UserQuizzesRepository } from '../repository/UserQuizzesRepository.js';
import { QuestionsRepository } from '../repository/QuestionsRepository.js';
import { QuizAttemptsRepo } from '../repository/QuizAttemptsRepository.js';
import { AttemptAnswersRepo } from '../repository/AttemptsAnswersRepo.js';
import { db } from '../db/db.js';
import { QuizAccessRepo } from '../repository/QuizAccessRepo.js';

const router = express.Router();

// ROUTER FOR MAKING QUIZ ---------------------------------------------
router.post(
  '/',
  verifyToken,
  userBasedRateLimiter(3, 3),
  quizInputValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, role } = req.user;

    if (role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    const formattedData: Quiz = {
      user_id: id,
      quiz_title: req.body.quizTitle,
      quiz_description: req.body.description,
      share_token: req.body.shareToken,
      accessibility: req.body.accessibility,
      max_attempts: req.body.maxAttempts,
      due_date: new Date(req.body.dueDate),
      status: req.body.status,
    };

    try {
      //insert quiz data to database
      const newQuiz = await db.transaction(async (tx) => {
        const quiz = await UserQuizzesRepository.insertNewQuiz(
          formattedData,
          tx,
        );
        if (!quiz) {
          throw new Error('Failed to create quiz');
        }
        if (req.body.classIds?.length > 0) {
          const quizAccessInsert = await QuizAccessRepo.insert(
            quiz.id,
            req.body.classIds,
            tx,
          );
          if (!quizAccessInsert)
            throw new Error('Failed to handle accessibility');
        }

        return quiz;
      });

      return res
        .status(201)
        .json({ success: true, message: 'Quiz Forged!', quiz: newQuiz });
    } catch (error: any) {
      if (error.cause?.code === '23505') {
        return res.status(500).json({ message: 'Share token is taken' });
      }
      return next(error);
    }
  },
);

// ROUTER FOR GETTING ALL QUIZ RELATED TO USER ----------------------------------------
router.get(
  '/',
  verifyToken,
  userBasedRateLimiter(5, 5),
  async (req, res, next) => {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const MAX_LIMIT = 20;

    if (limit < 0 || offset < 0 || limit > MAX_LIMIT) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid pagination parameters' });
    }

    try {
      //count all questions assigned to a quiz
      const userQuizzes = await UserQuizzesRepository.getAllUserQuizzes(
        req.user.id,
        limit,
        offset,
      );
      const totalQuizzes = await UserQuizzesRepository.countTotalQuizzes(
        req.user.id,
      );
      return res.status(200).json({ success: true, userQuizzes, totalQuizzes });
    } catch (error) {
      next(error);
    }
  },
);

// ROUTER FOR GETTING ALL QUESTIONS RELATED TO QUIZ ------------------------------------
router.get(
  '/questions',
  verifyToken,
  userBasedRateLimiter(5, 10),
  async (req, res, next) => {
    const { quizId } = req.query;
    if (!quizId) {
      return res
        .status(400)
        .json({ success: false, message: 'You must select a quiz' });
    }
    if (req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(quizId));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const questionList = await QuestionsRepository.getQuestionsRelatedToQuiz(
        Number(quizId),
      );

      if (questionList.length < 1) {
        return res.status(404).json({
          success: false,
          message: 'There are no questions in this quiz',
        });
      }

      return res.status(200).json({ success: true, questionList });
    } catch (error) {
      return next(error);
    }
  },
);

// ROUTER TO CHECK IF QUIZ HAS ATTEMPTS ----------------------------------------------
router.get(
  '/:quizId/attempts',
  verifyToken,
  userBasedRateLimiter(3, 3),
  async (req, res, next) => {
    const quizId = Number(req.params.quizId);
    if (Number.isNaN(quizId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Quiz ID' });
    }
    if (req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }
    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(quizId));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const attemptsExist =
        await QuizAttemptsRepo.getFirstFinishedAttempt(quizId);
      if (!attemptsExist) {
        return res
          .status(404)
          .json({ success: false, message: 'No attempts yet' });
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

// ROUTER TO GET METRICS FOR DASHBOARD ----------------------------------------------
router.get(
  '/:quizId/metrics',
  verifyToken,
  userBasedRateLimiter(5, 10),
  async (req, res, next) => {
    const quizId = Number(req.params.quizId);
    const { role } = req.user;
    if (Number.isNaN(quizId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Quiz ID' });
    }
    if (role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(quizId));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const [totalTakersAndAverage, highestScoreAndUser, lowestScore] =
        await Promise.all([
          QuizAttemptsRepo.getTotalTakersAndAverage(quizId),
          QuizAttemptsRepo.getHighestScoreAndName(quizId),
          QuizAttemptsRepo.getLowestScore(quizId),
        ]);
      const lowestScoreValue = lowestScore ?? 0;

      return res.status(200).json({
        success: true,
        totalTakers: totalTakersAndAverage?.totalTakers ?? 0,
        quizAverage: totalTakersAndAverage?.average ?? 0,
        highestScore: highestScoreAndUser?.highestScore ?? 0,
        highestScorer: highestScoreAndUser
          ? `${highestScoreAndUser.name} ${highestScoreAndUser.lastName}`
          : null,
        lowestScore: lowestScoreValue,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// ROUTER TO GET STUDENT RANKING FOR DASHBOARD -----------------------------------------
router.get(
  '/:quizId/students',
  verifyToken,
  userBasedRateLimiter(5, 10),
  async (req, res, next) => {
    const quizId = Number(req.params.quizId);
    const { role } = req.user;
    if (Number.isNaN(quizId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Quiz ID' });
    }
    if (role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(quizId));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const studentRanking = await QuizAttemptsRepo.getStudentRanking(quizId);
      const studentRankingWithCombinedName = studentRanking.map((s) => {
        return {
          id: s.studentId,
          name: `${s.name} ${s.lastName}`,
          score: s.score,
        };
      });

      return res.status(200).json({
        success: true,
        data: studentRankingWithCombinedName,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// GET QUESTION CORRECTION RATE RANKING FOR DASHBOARD ----------------------------------
router.get(
  '/:quizId/questions',
  verifyToken,
  userBasedRateLimiter(5, 10),
  async (req, res, next) => {
    const quizId = Number(req.params.quizId);
    const { role } = req.user;
    if (Number.isNaN(quizId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Quiz ID' });
    }
    if (role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(quizId));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const questionsRanking =
        await AttemptAnswersRepo.getQuestionCorrectionRate(quizId);
      return res.status(200).json({ success: true, data: questionsRanking });
    } catch (error) {
      next(error);
    }
  },
);

// GET ALL QUIZ TAKER SCORE -------------------------------------------------------------
router.get(
  '/:quizId/score',
  verifyToken,
  userBasedRateLimiter(5, 10),
  async (req, res, next) => {
    const quizId = Number(req.params.quizId);
    const { role } = req.user;

    if (Number.isNaN(quizId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Quiz ID' });
    }
    if (role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(quizId));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const userScores = await QuizAttemptsRepo.getBestAttemptsPerUser(quizId);
      return res.status(200).json({ success: true, data: userScores });
    } catch (error) {
      next(error);
    }
  },
);

// ROUTER FOR QUESTION UPDATES ------------------------------------------------------
router.patch(
  '/:quizId/question/:questionId',
  verifyToken,
  userBasedRateLimiter(5, 5),
  questionInputValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    const { questionId, quizId } = req.params;

    if (req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(quizId));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const dataForDrizzle = {
        question_text: req.body.questionText,
        question_type: req.body.questionType,
        correct_answer: req.body.correctAnswer,
        option_a: req.body.optionA,
        option_b: req.body.optionB,
        option_c: req.body.optionC,
        option_d: req.body.optionD,
      };

      const updatedQuestion = await QuestionsRepository.updateQuestionReturning(
        dataForDrizzle,
        Number(questionId),
      );
      return res.status(200).json({
        success: true,
        message: 'Question updated!',
        updatedQuestion: updatedQuestion,
      });
    } catch (err) {
      return next(err);
    }
  },
);

//ROUTER FOR QUIZ METADATA UPDATES -------------------------------------------------
router.patch(
  '/:id',
  verifyToken,
  userBasedRateLimiter(5, 5),
  quizInputValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.user;
    const { id } = req.params;

    if (role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }

    if (Object.keys(req.body).length < 1) {
      return res
        .status(400)
        .json({ success: false, message: 'No changes to be saved' });
    }

    try {
      const quizInfo = await UserQuizzesRepository.getQuizById(Number(id));
      if (!quizInfo || quizInfo.user_id !== req.user.id) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      }

      const dataForDrizzle = {
        quiz_title: req.body.quizTitle,
        quiz_description: req.body.description,
        time_limit: req.body.timeLimit,
        due_date: new Date(req.body.dueDate),
        max_attempts: req.body.maxAttempts,
        status: req.body.status,
      };

      const updatedQuiz = await UserQuizzesRepository.updateQuizDataReturnAll(
        dataForDrizzle,
        Number(id),
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return next(error);
    }
  },
);

// DELETE QUIZ
router.delete(
  '/:id',
  verifyToken,
  userBasedRateLimiter(5, 5),
  async (req, res, next) => {
    const quizIdNum = Number(req.params.id);
    if (Number.isNaN(quizIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Quiz ID' });
    }
    if (req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }
    try {
      const deletedQuiz = await UserQuizzesRepository.deleteQuiz(
        req.user.id,
        quizIdNum,
      );
      if (!deletedQuiz) {
        return res
          .status(404)
          .json({ success: false, message: 'Quiz not found' });
      } else {
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
