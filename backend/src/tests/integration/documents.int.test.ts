// src/tests/integration/documents.int.test.ts
//
// Tests for:
//   GET    /api/documents
//   GET    /api/documents/:id
//   DELETE /api/documents/:id
//
// WHY we seed directly with drizzle here:
//   The upload route processes a real file (PDF/DOCX) and calls an AI
//   extraction service, which is too heavy for integration tests.
//   Instead, we INSERT a row directly into uploaded_files so we have
//   a document to test GET and DELETE against.

import request from 'supertest';
import { eq } from 'drizzle-orm';
import app from '../../server.js';
import { db, pool } from '../../db/db.js';
import { uploaded_files } from '../../db/schema.js';
import { loginAs, authHeader, TEACHER_CREDS } from './setup/testHelpers.js';

// ── Shared state ─────────────────────────────────────────────────────────────
let teacherToken: string;
let teacherId: number;
let seededDocId: number;

// ─────────────────────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Log in as the seeded teacher
  const result = await loginAs(TEACHER_CREDS.email, TEACHER_CREDS.password);
  teacherToken = result.accessToken;
  teacherId = result.userId;

  // Seed a document row directly so we don't need a real file upload
  const [doc] = await db
    .insert(uploaded_files)
    .values({
      user_id: teacherId,
      filename: 'test_document.pdf',
      file_path: '/fake/path/test_document.pdf',
      file_hash: 'abc123hash',
      extracted_text: 'This is the extracted text from the test document.',
    })
    .returning();

  if(!doc){
    throw new Error('Failed to seed document for testing');
  }

  seededDocId = doc?.id;
});

afterAll(async () => {
  // Clean up any documents this test file created
  // (cascade deletes questions too, so no extra cleanup needed)
  await db.delete(uploaded_files).where(eq(uploaded_files.id, seededDocId));
  if(pool) await pool.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/documents', () => {

  it('200 — returns the list of documents owned by the teacher', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Each item should have at minimum an id and a filename/title
    const doc = res.body[0];
    expect(doc).toHaveProperty('id');
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/documents/:id', () => {

  it('200 — returns the document content for a valid owned document', async () => {
    const res = await request(app)
      .get(`/api/documents/${seededDocId}`)
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(seededDocId);
    expect(res.body.content).toBe(
      'This is the extracted text from the test document.'
    );
  });

  it('404 — returns 404 for a document that does not exist', async () => {
    const res = await request(app)
      .get('/api/documents/999999')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(404);
  });

  it('400 — returns 400 for a non-numeric id', async () => {
    const res = await request(app)
      .get('/api/documents/abc')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(400);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app).get(`/api/documents/${seededDocId}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/documents/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/documents/:id', () => {

  // We seed a separate doc just for the delete test so the GET tests
  // are not affected by a deletion.
  let docToDeleteId: number;

  beforeEach(async () => {
    const [doc] = await db
      .insert(uploaded_files)
      .values({
        user_id: teacherId,
        filename: 'to_be_deleted.pdf',
        file_path: '/fake/path/to_be_deleted.pdf',
        file_hash: 'deletehash123',
        extracted_text: 'Delete me.',
      })
      .returning();
    
    if(!doc){
      throw new Error('Failed to seed document for testing');
    }

    docToDeleteId = doc?.id;
  });

  it('200 — successfully deletes an owned document', async () => {
    const res = await request(app)
      .delete(`/api/documents/${docToDeleteId}`)
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — returns 404 when trying to delete a non-existent document', async () => {
    const res = await request(app)
      .delete('/api/documents/999999')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(404);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app).delete(`/api/documents/${docToDeleteId}`);
    expect(res.status).toBe(401);
  });
});
