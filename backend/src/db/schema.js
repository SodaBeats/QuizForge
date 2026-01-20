import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const uploaded_files = pgTable('uploaded_files', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileHash: varchar('file_hash', { length: 64 }).notNull(),
  extractedText: text('extracted_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});