import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const uploaded_files = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  file_path: text('file_path').notNull(),
  file_hash: varchar('file_hash', { length: 64 }).notNull(),
  extracted_text: text('extracted_text'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});