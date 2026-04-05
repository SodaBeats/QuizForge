
import type {InferInsertModel} from 'drizzle-orm';
import { db, type DB, type Transaction } from '../db/db.js';
import { attempt_answers_db } from '../db/schema.js';

type AttemptAnswersInsertData = InferInsertModel<typeof attempt_answers_db>;

export const AttemptAnswersRepo = {
  
  async insertAttemptAnswer(data: AttemptAnswersInsertData[], tx: DB | Transaction = db){
    await tx.insert(attempt_answers_db).values(data)
  }
};