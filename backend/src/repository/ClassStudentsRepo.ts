import type { InferInsertModel } from 'drizzle-orm';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import { classes_students_db, users } from '../db/schema.js';

export const ClassStudentsRepository = {
  // get all students in array of class
  async getAllStudentsOfEachClass(classIds: number[]) {
    if (classIds.length === 0) return [];

    const result = await db
      .select({
        classId: classes_students_db.class_id,
        studentEmail: users.email,
        studentName: sql<string>`${users.first_name} || ' ' || ${users.last_name}`,
      })
      .from(classes_students_db)
      .innerJoin(users, eq(classes_students_db.student_id, users.id))
      .where(inArray(classes_students_db.class_id, classIds));

    return result;
  },
};
