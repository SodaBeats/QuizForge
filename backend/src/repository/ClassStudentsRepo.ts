import type { InferInsertModel } from 'drizzle-orm';
import { eq, inArray, sql, and } from 'drizzle-orm';
import { db } from '../db/db.js';
import { classes_db, students_classes_db, users } from '../db/schema.js';

export const ClassStudentsRepository = {
  // get all students in array of class
  async getAllStudentsOfEachClass(classIds: number[]) {
    if (classIds.length === 0) return [];

    const result = await db
      .select({
        id: users.id,
        classId: students_classes_db.class_id,
        email: users.email,
        name: sql<string>`${users.first_name} || ' ' || ${users.last_name}`,
      })
      .from(students_classes_db)
      .innerJoin(users, eq(students_classes_db.student_id, users.id))
      .where(inArray(students_classes_db.class_id, classIds));

    return result;
  },

  // check if user is in class, return boolean
  async checkIfUserInClass(userId: number, classId: number) {
    const [result] = await db
      .select()
      .from(students_classes_db)
      .where(
        and(
          eq(students_classes_db.student_id, userId),
          eq(students_classes_db.class_id, classId),
        ),
      );
    return result ? true : false;
  },

  // add student to class, return data
  async addStudentToClass(classId: number, studentId: number) {
    const [result] = await db
      .insert(students_classes_db)
      .values({ class_id: classId, student_id: studentId })
      .returning({
        id: students_classes_db.id,
        studentId: students_classes_db.student_id,
        classId: students_classes_db.class_id,
      });
    return result ? result : null;
  },

  async removeStudentFromClass(classId: number, studentId: number) {
    const [result] = await db
      .delete(students_classes_db)
      .where(
        and(
          eq(students_classes_db.class_id, classId),
          eq(students_classes_db.student_id, studentId),
        ),
      )
      .returning({ id: students_classes_db.id });

    return result ?? null;
  },

  async getAllClassOfStudent(studentId: number) {
    const result = await db
      .select({ classId: students_classes_db.class_id })
      .from(students_classes_db)
      .where(eq(students_classes_db.student_id, studentId));

    return result.length > 0 ? result.map((row) => row.classId) : null;
  },
};
