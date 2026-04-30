import type { InferInsertModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { questions_db } from '../db/schema.js';

type QuestionInputData = InferInsertModel<typeof questions_db>;
type QuestionUpdateData = Partial<QuestionInputData>;

export const QuestionsRepository = {
  //insert question to db
  async insertQuestionToDb(data: QuestionInputData) {
    const [inserted] = await db.insert(questions_db).values(data).returning();
    return inserted
      ? {
          questionId: inserted.id,
        }
      : null;
  },

  //insert arrays of questions
  async insertQuestionsToDb(data: QuestionInputData[]) {
    const insert = await db.insert(questions_db).values(data).returning({
      id: questions_db.id,
      quizId: questions_db.quiz_id,
      questionText: questions_db.question_text,
      questionType: questions_db.question_type,
      timeLimit: questions_db.time_limit,
      correctAnswer: questions_db.correct_answer,
      optionA: questions_db.option_a,
      optionB: questions_db.option_b,
      optionC: questions_db.option_c,
      optionD: questions_db.option_d,
    });
    return insert.length > 0 ? insert : null;
  },

  //get all questions related to quiz Id
  async getAllQuestionsByQuizId(quizId: number) {
    const questions = await db.query.questions_db.findMany({
      where: eq(questions_db.quiz_id, quizId),
    });
    return questions ?? null;
  },

  //check which quiz owns the question
  async checkWhichQuizOwnsQuestion(qId: number) {
    const [question] = await db
      .select()
      .from(questions_db)
      .where(eq(questions_db.id, qId));
    return question ? question.quiz_id : null;
  },

  //update question data
  async updateQuestion(data: QuestionUpdateData, qId: number) {
    const [updated] = await db
      .update(questions_db)
      .set(data)
      .where(eq(questions_db.id, qId))
      .returning({
        id: questions_db.id,
        quizId: questions_db.quiz_id,
        questionText: questions_db.question_text,
        questionType: questions_db.question_type,
        timeLimit: questions_db.time_limit,
        correctAnswer: questions_db.correct_answer,
        optionA: questions_db.option_a,
        optionB: questions_db.option_b,
        optionC: questions_db.option_c,
        optionD: questions_db.option_d,
      });
    return updated ?? null;
  },

  //update question data but return all
  async updateQuestionReturning(data: QuestionUpdateData, qId: number) {
    const [updated] = await db
      .update(questions_db)
      .set(data)
      .where(eq(questions_db.id, qId))
      .returning();
    return updated ?? null;
  },

  //delete question by id
  async deleteQuestionById(qId: number) {
    const [deleted] = await db
      .delete(questions_db)
      .where(eq(questions_db.id, qId))
      .returning();
    return deleted ? { qId: deleted.id } : null;
  },

  //get questions by quiz id
  async getQuestionsRelatedToQuiz(quizId: number) {
    const questionsList = await db
      .select({
        id: questions_db.id,
        quizId: questions_db.quiz_id,
        questionText: questions_db.question_text,
        questionType: questions_db.question_type,
        timeLimit: questions_db.time_limit,
        correctAnswer: questions_db.correct_answer,
        optionA: questions_db.option_a,
        optionB: questions_db.option_b,
        optionC: questions_db.option_c,
        optionD: questions_db.option_d,
      })
      .from(questions_db)
      .where(eq(questions_db.quiz_id, quizId));

    return questionsList ?? null;
  },
};
