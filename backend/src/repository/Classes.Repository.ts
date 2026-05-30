import type { InferInsertModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { classes_db } from '../db/schema.js';

type ClassesInputData = InferInsertModel<typeof classes_db>;

export const ClassesRepository = {
  // insert created class to db
  async insertClassToDb(data: ClassesInputData) {
    const [result] = await db.insert(classes_db).values(data).returning({
      id: classes_db.id,
      teacherId: classes_db.teacher_id,
      className: classes_db.class_name,
      subject: classes_db.class_subject,
    });

    return result ? result : null;
  },
};
