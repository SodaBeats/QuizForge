import { pgTable, serial, text, timestamp, varchar, integer, uuid, boolean, unique, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const uploaded_files = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade'}),
  filename: varchar('filename', { length: 255 }).notNull(),
  file_path: text('file_path').notNull(),
  file_hash: varchar('file_hash', { length: 64 }).notNull(),
  extracted_text: text('extracted_text'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const questions_db = pgTable('questions_db', {
  id: serial('id').primaryKey(),
  document_id: integer('document_id')
    .notNull()
    .references(() => uploaded_files.id, { onDelete: 'cascade' }),
  question_text: text('question_text').notNull(),
  question_type: varchar('question_type', { length: 50 }).notNull(),
  correct_answer: text('correct_answer'),
  option_a: text('option_a'),
  option_b: text('option_b'),
  option_c: text('option_c'),
  option_d: text('option_d'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id').unique().notNull().defaultRandom(),
  first_name: text('first_name', { length: 64 }).notNull(),
  last_name: text('last_name', { length: 64 }).notNull(),
  email: text('email').unique().notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: text('role', { enum: ['student', 'teacher', 'admin'] }).default('student').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const refresh_tokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false)
});

export const quizzes_db = pgTable('quizzes_db', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  quiz_title: varchar('quiz_title', { length: 255 }).notNull(),
  quiz_description: text('quiz_description'),
  share_token: varchar('share_token', { length: 12 }).unique().notNull().default(sql`substring(md5(random()::text), 1, 12)`),
  time_limit: integer('time_limit').default(0),
  max_attempts: integer('max_attempts').default(1).notNull(),
  status: text('status').notNull().default('draft'),
  due_date: timestamp('due_date', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  
}, (table)=> {
  return{
    quizTokenIndex: index('quiz_token_idx').on(table.share_token),
  }
});

export const quiz_questions_db = pgTable('quiz_questions_db', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').references(()=>quizzes_db.id, {onDelete: 'cascade'}).notNull(),
  question_id: integer('question_id').references(()=>questions_db.id, {onDelete: 'cascade'}).notNull(),
}, (table)=>{
  return {
    // This index to speed up extraction of questions assigned  to the same quiz id
    quizIdIndex: index('quiz_id_idx').on(table.quiz_id),

    // Prevent the same question from being added to the same quiz twice
    uniqueQuizQuestion: unique('unique_quiz_question').on(table.quiz_id, table.question_id),
  }
});

export const quiz_attempts_db = pgTable("quiz_attempts_db", {
  id: serial("id").primaryKey(),
  
  // Connects to the Quiz
  quiz_id: integer("quiz_id")
    .references(() => quizzes_db.id, { onDelete: 'cascade' })
    .notNull(),
  
  // Connects to the Student
  user_id: integer("user_id")
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  
  // The result data
  score: integer("score").default(0),
  
  // Helpful metadata
  status: text("status").default('completed'), // 'in-progress' or 'completed'

  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const attempt_answers_db = pgTable('attempt_answers_db', {
  id: serial('id').primaryKey(),

  quiz_id: integer('quiz_id')
    .notNull()
    .references(() => quizzes_db.id, { onDelete: 'cascade' }),

  attempt_id: integer('attempt_id')
    .notNull()
    .references(() => quiz_attempts_db.id, { onDelete: 'cascade' }),

  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  question_id: integer('question_id')
    .notNull()
    .references(() => questions_db.id, { onDelete: 'cascade' }),

  chosen_answer: text('chosen_answer'),
  correct_answer: text('correct_answer').notNull(),
  is_correct: boolean('is_correct').notNull().default(false),

  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Speed up the dashboard query — you'll always filter by quiz_id
  // when building the difficulty ranking
  quizIdIndex: index('attempt_answers_quiz_id_idx').on(table.quiz_id),

  // Speed up per-question aggregation
  questionIdIndex: index('attempt_answers_question_id_idx').on(table.question_id),

  // Prevent a student from submitting the same question twice in the same attempt
  uniqueAttemptQuestion: unique('unique_attempt_question').on(table.attempt_id, table.question_id),
}));



// --RELATIONS

export const quizzesRelations = relations(quizzes_db, ({many}) => ({
  quiz_questions_db: many(quiz_questions_db),
}));

export const questionsRelations = relations(questions_db, ({many})=>({
  quiz_questions_db: many(quiz_questions_db),
}));

export const quizQuestionsRelations = relations(quiz_questions_db, ({one})=>({
  quiz: one(quizzes_db, {
    fields: [quiz_questions_db.quiz_id],
    references: [quizzes_db.id]
  }),
  question: one(questions_db, {
    fields: [quiz_questions_db.question_id],
    references: [questions_db.id]
  }),
}));