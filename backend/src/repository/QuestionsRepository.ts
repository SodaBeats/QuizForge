
import type {InferInsertModel} from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { questions_db, quiz_questions_db } from '../db/schema.js';

type QuestionInputData = InferInsertModel<typeof questions_db>;
type QuestionUpdateData = Partial<QuestionInputData>;

export const QuestionsRepository = {

  //insert question to db
  async insertQuestionToDb(data: QuestionInputData){
    const [inserted] = await db.insert(questions_db).values(data).returning();
    return inserted ? {
      documentId: inserted.document_id,
      questionId: inserted.id
    } : null;
  },

  //get all questions related to document Id
  async getAllQuestionsByDocId(docId: number){
    const questions = await db.query.questions_db.findMany({
          where: eq(questions_db.document_id, docId)
        });
    return questions ?? null;
  },

  //check which document owns the question
  async checkWhichDocOwnsQuestion(qId: number){
    const [question] = await db.select({documentId: questions_db.document_id})
      .from(questions_db)
      .where(eq(questions_db.id, qId));
    return question?.documentId ?? null;
  },

  //update question data
  async updateQuestion(data: QuestionUpdateData, qId: number){
    const [updated] = await db.update(questions_db)
      .set(data)
      .where (eq(questions_db.id, qId))
      .returning();
    return updated ? {qId: updated.id} : null;  },

  //update question data but return all
  async updateQuestionReturning(data: QuestionUpdateData, qId: number){
    const [updated] = await db.update(questions_db)
      .set(data)
      .where(eq(questions_db.id, qId))
      .returning();
    return updated ?? null;
  },

  //delete question by id
  async deleteQuestionById(qId: number){
    const [deleted] = await db.delete(questions_db)
      .where(eq(questions_db.id, qId))
      .returning();
    return deleted ? {qId: deleted.id} : null;
  },

  //get questions by quiz id
  async getQuestionsRelatedToQuiz(quizId: number){
    const questionsList = await db.select({
          id: questions_db.id,
          questionText: questions_db.question_text,
          questionType: questions_db.question_type,
          correctAnswer: questions_db.correct_answer,
          optionA: questions_db.option_a,
          optionB: questions_db.option_b,
          optionC: questions_db.option_c,
          optionD: questions_db.option_d,
        })
        .from(questions_db)
        .innerJoin(quiz_questions_db, eq(questions_db.id, quiz_questions_db.question_id))
        .where(eq(quiz_questions_db.quiz_id, quizId));

    return questionsList ?? null;
  },

};