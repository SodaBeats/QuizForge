import express from 'express';
import ollama from 'ollama';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { questionInputValidator } from '../middlewares/questionValidator.middleware.js';
import { UploadedFilesRepository } from '../repository/UploadedFilesRepository.js';
import { QuestionsRepository } from '../repository/QuestionsRepository.js';
import { DocumentChunksRepo } from '../repository/DocumentChunksRepo.js';

//establish router
const router = express.Router();

// ROUTER FOR MAKING QUESTIONS
router.post(
  '/',
  verifyToken,
  questionInputValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    // make sure the supplied document actually belongs to the user
    const docIdNum = Number(req.body.documentId);
    if (Number.isNaN(docIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid documentId' });
    }

    try {
      //checks if doc exists and is owned by owner. Returns boolean
      const owner = await UploadedFilesRepository.isDocOwnedByOwnerId(
        docIdNum,
        req.user.id,
      );
      if (!owner) {
        return res
          .status(404)
          .json({ success: false, message: 'Document not found' });
      }

      //format data for database insertion
      const formattedData = {
        document_id: docIdNum,
        question_text: req.body.questionText,
        question_type: req.body.questionType,
        correct_answer: req.body.correctAnswer,
        option_a: req.body.optionA,
        option_b: req.body.optionB,
        option_c: req.body.optionC,
        option_d: req.body.optionD,
        time_limit: req.body.timeLimit,
      };

      const insertedQuestion =
        await QuestionsRepository.insertQuestionToDb(formattedData);

      if (!insertedQuestion) {
        return res
          .status(500)
          .json({ success: false, message: 'Failed to create question' });
      }

      return res.status(201).json({
        success: true,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post('/generate', verifyToken, async (req, res, next) => {
  const { questionType, timeLimit, questionAmount } = req.body.generateOptions;
  const { documentId } = req.body;
  if (!questionType || !timeLimit || !documentId || !questionAmount) {
    return res.status(400).json({
      success: false,
      message: 'Incomplete data',
    });
  }

  try {
    console.log('generating...');

    const numberOfChunks = await DocumentChunksRepo.countChunks(
      documentId,
      req.user.id,
    );
    if (!numberOfChunks || numberOfChunks === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'There is no document' });
    }

    const rawChunks = await DocumentChunksRepo.getDocumentChunks(
      documentId,
      req.user.id,
    );
    const chunkTexts = rawChunks!
      .map((c) => {
        return c.content;
      })
      .join(' ');

    const questionSchema = z.array(
      z.object({
        question_text: z.string(),
        option_a: z.string().optional(),
        option_b: z.string().optional(),
        option_c: z.string().optional(),
        option_d: z.string().optional(),
        correct_answer: z.string(),
      }),
    );

    const jsonSchema = questionSchema.toJSONSchema();

    const messages = [
      {
        role: 'system',
        content: `
          # PERSONA
          You are a specialized Quiz Generation Engine. 

          # GENERATION RULES
          Follow these requirements strictly based on the "question_type":

          ## 1. Multiple-Choice
          - Required: [question_text, correct_answer, option_a, option_b, option_c, option_d]
          - Constraint: For the correct_answer, only choose the letter of the correct answer from option_a, option_b, option_c, option_d.

          ## 2. True-False
          - Required: [question_text, correct_answer]
          - Constraint: correct_answer must be exactly "true" or "false".

          ## 3. Short-Answer
          - Required: [question_text, correct_answer]
          - Constraint: correct_answer can just be 'placeholder'.
          `,
      },
      {
        role: 'user',
        content: `Make ${questionAmount} ${questionType} questions based on the text below.
        
        text: ${chunkTexts}`,
      },
    ];

    const ollamaResponse = await ollama.chat({
      model: 'qwen2.5:3b',
      messages: messages,
      format: jsonSchema,
      stream: false,
    });

    const parsedQuestions = questionSchema.safeParse(
      JSON.parse(ollamaResponse.message.content),
    );
    if (!parsedQuestions.success) {
      return res.status(500).json({
        success: false,
        message: 'The LLM returned an unexpected format',
      });
    }
    const questionsArrayToInsert = parsedQuestions.data.map((q) => {
      return {
        ...q,
        document_id: documentId,
        question_type: questionType,
        time_limit: timeLimit,
      };
    });
    const insertedQuestions = await QuestionsRepository.insertQuestionsToDb(
      questionsArrayToInsert,
    );
    if (!insertedQuestions || insertedQuestions.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Failed to insert generated questions',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Questions Generated!',
      questions: insertedQuestions,
    });
  } catch (error) {
    next(error);
  }
});

// ROUTER FOR GETTING QUESTIONS RELATED TO DOCUMENT
router.get('/', verifyToken, async (req, res, next) => {
  const docIdNum = Number(req.query.documentId);
  if (Number.isNaN(docIdNum)) {
    return res
      .status(400)
      .json({ success: false, message: 'documentId must be a number' });
  }

  try {
    // ensure the document belongs to this user before returning questions
    const owner = await UploadedFilesRepository.isDocOwnedByOwnerId(
      docIdNum,
      req.user.id,
    );
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    //get all questions related to docId
    const questions =
      await QuestionsRepository.getAllQuestionsByDocId(docIdNum);
    if (!questions) {
      return res
        .status(404)
        .json({ success: false, message: 'No questions found' });
    }

    return res.status(200).json(questions);
  } catch (error) {
    return next(error);
  }
});

// ROUTER FOR EDITING QUESTIONS
router.patch(
  '/:id',
  verifyToken,
  questionInputValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const {
      questionText,
      questionType,
      timeLimit,
      correctAnswer,
      optionA,
      optionB,
      optionC,
      optionD,
    } = req.body;

    try {
      // make sure the question belongs to this user by joining document ownership
      const documentId =
        await QuestionsRepository.checkWhichDocOwnsQuestion(id);
      if (!documentId) {
        return res
          .status(404)
          .json({ success: false, message: 'Question not found' });
      }

      const owner = await UploadedFilesRepository.isDocOwnedByOwnerId(
        documentId,
        req.user.id,
      );
      if (!owner) {
        return res
          .status(404)
          .json({ success: false, message: 'Question not found' });
      }

      const formattedData = {
        document_id: documentId,
        question_text: questionText,
        question_type: questionType,
        time_limit: timeLimit,
        correct_answer: correctAnswer,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
      };

      const updatedQuestion = await QuestionsRepository.updateQuestion(
        formattedData,
        id,
      );

      if (!updatedQuestion) {
        return res
          .status(404)
          .json({ success: false, message: 'Question not found' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete('/:id', verifyToken, async (req, res, next) => {
  const questionIdNum = Number(req.params.id);
  if (Number.isNaN(questionIdNum)) {
    return res
      .status(400)
      .json({ success: false, message: 'You must select a question' });
  }
  try {
    // make sure the question belongs to this user by joining document ownership
    const documentId =
      await QuestionsRepository.checkWhichDocOwnsQuestion(questionIdNum);
    if (!documentId) {
      return res
        .status(404)
        .json({ success: false, message: 'Question not found' });
    }
    //check if document is owned by user
    const owner = await UploadedFilesRepository.isDocOwnedByOwnerId(
      documentId,
      req.user.id,
    );
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: 'Question not found' });
    }

    const deletedQuestion =
      await QuestionsRepository.deleteQuestionById(questionIdNum);
    if (!deletedQuestion) {
      return res
        .status(404)
        .json({ success: false, message: 'Question not found' });
    } else {
      return res
        .status(200)
        .json({ success: true, message: 'Question Deleted!' });
    }
  } catch (error) {
    return next(error);
  }
});

export default router;
