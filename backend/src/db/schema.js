import { pgTable, serial, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const uploaded_files = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  file_path: text('file_path').notNull(),
  file_hash: varchar('file_hash', { length: 64 }).notNull(),
  extracted_text: text('extracted_text'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const quiz_questions = pgTable('quiz_questions', {
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