# Deployment — text embeddings (switching providers)

All embedding logic lives in `backend/src/lib/embedText.ts` — the only module that knows which
provider serves embeddings. Both call sites (chunk embedding in `fileExtract.service.ts`, RAG
query embedding in `question.route.ts`) go through it, so they can never drift to different
models or vector spaces. **Switching backends is an env-var change, not a code change**; boot
fails fast via `assertEmbeddingConfigured()` in `src/index.ts` (mirrors `assertGroqConfigured()`).

Transport is the global `fetch` for both providers — the `ollama` npm package was removed.

## Environments

| Environment         | Variables                                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| local dev (default) | `EMBEDDING_PROVIDER=ollama` (or unset). Optional: `EMBEDDING_MODEL` (default `mxbai-embed-large:latest`, 1024-dim), `OLLAMA_HOST` (default `http://localhost:11434`) — no key needed                  |
| production          | `EMBEDDING_PROVIDER=jina` + `JINA_API_KEY` + `JINA_EMBED_MODEL` (e.g. `jina-embeddings-v5-omni-small`). Optional: `JINA_BASE_URL` (default `https://api.jina.ai/v1`; EU: `https://eu.api.jina.ai/v1`) |
| both                | `EMBEDDING_TIMEOUT_MS` — plain positive integer in ms (default `120000`; underscore forms like `120_000` are rejected)                                                                                |

See `backend/.env.example` for the documented template.

## Production switch checklist (→ Jina)

1. Set the production env vars:
   ```
   EMBEDDING_PROVIDER=jina
   JINA_API_KEY=jina_…
   JINA_EMBED_MODEL=jina-embeddings-v5-omni-small
   # JINA_BASE_URL=               # only for EU: https://eu.api.jina.ai/v1
   ```
   Boot fails fast with a clear message if the provider name is unknown or the required
   key/model are missing.
2. **Dimensions**: `jina-embeddings-v5-omni-small` = **1024** = `vector(1024)` in
   `backend/src/db/schema.js` → **schema unchanged** (verified 2026-11-16). If the model ever
   changes: check its output dims first; `dimensions ≠ 1024` means editing the schema column +
   `npm run db:migrate` **and** re-embedding everything.
3. **Never mix providers in one database.** Ollama (mxbai) and Jina vectors are different
   spaces at the same 1024 dims: no error, just **silent garbage retrieval**. Fresh DB per
   environment. If data ever must cross providers: re-embed all chunks with the target
   provider (a script — out of scope, would be added on demand).
4. Requests send `truncate: true` (clips an input over the 32K-token context instead of
   failing) — chunks realistically never approach the limit; remove it in `embedText.ts` if
   vetoed in review.
5. A future non-Jina provider: add one provider function + env branch inside `embedText.ts`
   only — call sites stay untouched.

## Operational notes

- Batches: `EMBED_BATCH_SIZE = 16` inputs per request (both providers), sequential
  sub-batches, with per-response count/dimension validation.
- Formatting is provider-owned: ollama queries get the `QUERY_PREFIX` (mxbai convention);
  Jina uses per-request task adapters (`retrieval.query` / `retrieval.passage`, set on every
  request — tasks are not baked into the model).
- Errors surface as `Embedding request to <url> failed: …`; the upload path wraps them as
  `File extraction service error: …`; the `/generate` route returns
  `500 { "success": false, "message": "Failed to embed user query" }` for any query-embed
  failure.
- Need to adjust chunking size for production (Jina)
