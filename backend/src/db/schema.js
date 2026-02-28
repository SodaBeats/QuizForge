import { pgTable, serial, text, timestamp, varchar, integer, uuid, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const uploaded_files = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
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

export const quizzes = pgTable('quizzes_db', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  quiz_title: varchar('quiz_title', { length: 255 }).notNull(),
  quiz_description: text('quiz_description'),
  share_token: varchar('share_token', { length: 12 }).unique().notNull().default(sql`substring(md5(random()::text), 1, 12)`),
  time_limit: integer('time_limit').default(0), 
  is_published: boolean('is_published').default(false).notNull(),
  due_date: timestamp('due_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});