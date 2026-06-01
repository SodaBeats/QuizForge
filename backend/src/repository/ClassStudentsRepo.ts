import type { InferInsertModel } from 'drizzle-orm';
import { eq, inArray, sql, and } from 'drizzle-orm';
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

  // check if user is in class, return boolean
  async checkIfUserInClass(userId: number, classId: number) {
    const [result] = await db
      .select()
      .from(classes_students_db)
      .where(
        and(
          eq(classes_students_db.student_id, userId),
          eq(classes_students_db.class_id, classId),
        ),
      );
    return result ? true : false;
  },
};
