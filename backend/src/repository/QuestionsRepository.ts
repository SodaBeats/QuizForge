
import type {InferInsertModel} from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { questions_db } from '../db/schema.js';

type QuestionInputData = InferInsertModel<typeof questions_db>;

export const QuestionsRepository = {

  async insertQuestionToDb(data: QuestionInputData){
    const [inserted] = await db.insert(questions_db).values(data).returning({
      documentId: questions_db.document_id,
      questionId: questions_db.id
    });
    return inserted ?? null;
  },

  async getAllQuestionsByDocId(docId: number){
    const questions = await db.query.questions_db.findMany({
          where: eq(questions_db.document_id, docId)
        });
    return questions ?? null;
  },

  async checkWhichDocOwnsQuestion(qId: number){
    const [question] = await db.select({documentId: questions_db.document_id})
      .from(questions_db)
      .where(eq(questions_db.id, qId));
    return question?.documentId ?? null;
  },

  async updateQuestion(data: QuestionInputData, qId: number){
    const [updated] = await db.update(questions_db)
      .set(data)
      .where (eq(questions_db.id, qId))
      .returning({qId: questions_db.id});
    return updated ?? null;
  },

  async deleteQuestionById(qId: number){
    const [deleted] = await db.delete(questions_db)
      .where(eq(questions_db.id, qId))
      .returning({qId: questions_db.id});
    return deleted ?? null;
  },

};