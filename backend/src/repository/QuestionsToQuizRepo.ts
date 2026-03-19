
import type { InferInsertModel } from "drizzle-orm";
import { db } from '../db/db.js';
import { quiz_questions_db } from "../db/schema.js";

type UserInputData = InferInsertModel<typeof quiz_questions_db>;

export const QuestionsToQuizRepo = {

  async assignQuestionsToQuizzes(data: UserInputData[]){
    await db.insert(quiz_questions_db).values(data)
  },

};