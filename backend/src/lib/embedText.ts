/**
 * Single entry point for text embeddings — the only module that knows which
 * provider serves them and how to call it.
 *
 * Two environments, selected by env (see .env.example):
 *
 *   local dev     — EMBEDDING_PROVIDER=ollama (default) → local Ollama, no key
 *   production    — EMBEDDING_PROVIDER=jina → Jina AI cloud API
 *
 *   EMBEDDING_PROVIDER   'ollama' (default) | 'jina'
 *   EMBEDDING_MODEL      ollama only; default 'mxbai-embed-large:latest'
 *   OLLAMA_HOST          ollama only; default 'http://localhost:11434'
 *   JINA_API_KEY         REQUIRED for jina
 *   JINA_EMBED_MODEL     REQUIRED for jina (e.g. jina-embeddings-v5-omni-small, 1024-dim)
 *   JINA_BASE_URL        jina only; default 'https://api.jina.ai/v1'
 *   EMBEDDING_TIMEOUT_MS per-request timeout; default 120000 (local CPU embedding
 *                        of a batch can be slow)
 *
 * Per-provider formatting (the whole point of hiding the provider here):
 *   - ollama: queries get QUERY_PREFIX (mxbai convention); chunks are raw text
 *   - jina: no text prefixes — Jina's per-request task adapters do the job
 *     (retrieval.query for queries, retrieval.passage for documents)
 *
 * Follows lib/aiClient.ts: env is read at call time (merely importing this module
 * never requires env) and assertEmbeddingConfigured() fails fast at server boot
 * (called from index.ts).
 */

/** RAG query prefix — ollama path only; Jina uses task adapters instead. */
export const QUERY_PREFIX =
  'Represent this sentence for searching relevant passages: ';

/**
 * Inputs per request — owner-chosen safe limit, shared by all providers.
 * Jina has no hard input-count cap; 16 keeps every request comfortably small
 * for both the cloud API and local Ollama.
 */
const EMBED_BATCH_SIZE = 16;

const DEFAULT_OLLAMA_MODEL = 'mxbai-embed-large:latest';
const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_JINA_BASE_URL = 'https://api.jina.ai/v1';
const DEFAULT_TIMEOUT_MS = 120_000;

type EmbeddingProvider = 'ollama' | 'jina';
type EmbeddingKind = 'query' | 'document';

type EmbeddingConfig =
  | { provider: 'ollama'; model: string; host: string; timeoutMs: number }
  | {
      provider: 'jina';
      model: string;
      apiKey: string;
      baseUrl: string;
      timeoutMs: number;
    };

interface EmbeddingResponse {
  data?: Array<{ index?: number; embedding?: number[] }>;
  usage?: { total_tokens: number };
}

/**
 * Read + validate embedding config from env. Throws a descriptive error for an
 * unknown provider or a missing required var, so both embedText() and the boot
 * assert share one validation path.
 */
const getEmbeddingConfig = (): EmbeddingConfig => {
  const provider = process.env.EMBEDDING_PROVIDER || 'ollama';
  if (provider !== 'ollama' && provider !== 'jina') {
    throw new Error(
      `Unknown EMBEDDING_PROVIDER '${provider}' (expected 'ollama' or 'jina')`,
    );
  }

  const timeoutRaw = process.env.EMBEDDING_TIMEOUT_MS;
  // Plain positive integer of milliseconds. Numeric separators like '120_000'
  // are a JS-literal feature only — Number('120_000') is NaN, so .env must
  // carry a plain value (e.g. 120000).
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid EMBEDDING_TIMEOUT_MS '${timeoutRaw}'`);
  }

  if (provider === 'jina') {
    const apiKey = process.env.JINA_API_KEY;
    const model = process.env.JINA_EMBED_MODEL;
    if (!apiKey) {
      throw new Error(
        'JINA_API_KEY is not set (required when EMBEDDING_PROVIDER=jina)',
      );
    }
    if (!model) {
      throw new Error(
        'JINA_EMBED_MODEL is not set (required when EMBEDDING_PROVIDER=jina)',
      );
    }
    return {
      provider: 'jina',
      model,
      apiKey,
      baseUrl: (process.env.JINA_BASE_URL || DEFAULT_JINA_BASE_URL).replace(
        /\/+$/,
        '',
      ),
      timeoutMs,
    };
  }

  return {
    provider: 'ollama',
    model: process.env.EMBEDDING_MODEL || DEFAULT_OLLAMA_MODEL,
    host: (process.env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST).replace(/\/+$/, ''),
    timeoutMs,
  };
};

/** POST JSON with a hard timeout; non-2xx → throw with status + body snippet. */
const postJson = async (
  url: string,
  body: unknown,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Embedding request to ${url} failed: ${detail}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Embedding request to ${url} failed: HTTP ${response.status} ${text.slice(0, 200)}`,
    );
  }
  return response.json();
};

const embedViaOllama = async (
  inputs: string[],
  config: Extract<EmbeddingConfig, { provider: 'ollama' }>,
): Promise<number[][]> => {
  const json = (await postJson(
    `${config.host}/api/embed`,
    { model: config.model, input: inputs },
    {},
    config.timeoutMs,
  )) as { embeddings?: number[][] };
  return json.embeddings ?? [];
};

const embedViaJina = async (
  inputs: string[],
  config: Extract<EmbeddingConfig, { provider: 'jina' }>,
  task: 'retrieval.query' | 'retrieval.passage',
): Promise<{ vectors: number[][]; usage: number }> => {
  const json = (await postJson(
    `${config.baseUrl}/embeddings`,
    // task: Jina's LoRA adapter — retrieval.query for queries, retrieval.passage
    // for documents (default text-matching is for symmetric similarity).
    // truncate: clip instead of failing if an input ever exceeds 32K tokens.
    { model: config.model, input: inputs, task, truncate: true },
    { Authorization: `Bearer ${config.apiKey}` },
    config.timeoutMs,
  )) as EmbeddingResponse;

  const data = json.data ?? [];
  const usage = json?.usage?.total_tokens ?? 0;
  // Jina returns OpenAI-shaped data; sort defensively by index (the count check
  // below still catches missing entries).
  const ordered = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return { vectors: ordered.map((entry) => entry.embedding ?? []), usage };
};

/** One response must contain exactly one non-empty, uniformly-sized vector per input. */
const validateBatch = (vectors: number[][], expected: number): void => {
  if (vectors.length !== expected) {
    throw new Error(
      `Embedding count mismatch: expected ${expected}, got ${vectors.length}`,
    );
  }
  const dimension = vectors[0]?.length;
  vectors.forEach((vector, index) => {
    if (!vector || vector.length < 1) {
      throw new Error(`Embedding at index ${index} is empty`);
    }
    if (vector.length !== dimension) {
      throw new Error(
        `Embedding dimension mismatch at index ${index}: expected ${dimension}, got ${vector.length}`,
      );
    }
  });
};

/** Sub-batched embed of one kind (query vs document) under one config. */
const embedBatch = async (
  inputs: string[],
  kind: EmbeddingKind,
  config: EmbeddingConfig,
): Promise<number[][]> => {
  const task = kind === 'query' ? 'retrieval.query' : 'retrieval.passage';
  const results: number[][] = [];

  for (let start = 0; start < inputs.length; start += EMBED_BATCH_SIZE) {
    const batch = inputs.slice(start, start + EMBED_BATCH_SIZE);
    const vectors =
      config.provider === 'ollama'
        ? await embedViaOllama(batch, config)
        : await embedViaJina(batch, config, task);
    validateBatch(vectors, batch.length);
    results.push(...vectors);
  }

  return results;
};

/**
 * Embed a batch of texts (document/chunk side). Returns vectors in input order.
 * Throws on misconfiguration, HTTP failure, or any count/dimension mismatch.
 */
export const embedText = async (inputs: string[]): Promise<number[][]> => {
  if (!Array.isArray(inputs) || inputs.length < 1) {
    throw new Error('embedText requires at least one input');
  }
  return embedBatch(inputs, 'document', getEmbeddingConfig());
};

/**
 * Embed one RAG query so it lands in the same vector space as the stored
 * document chunks: ollama gets QUERY_PREFIX, jina gets task=retrieval.query.
 */
export const embedQuery = async (query: string): Promise<number[]> => {
  const config = getEmbeddingConfig();
  const input =
    config.provider === 'ollama' ? `${QUERY_PREFIX}${query}` : query;
  const [first] = await embedBatch([input], 'query', config);
  if (!first) {
    throw new Error('Failed to embed query');
  }
  return first;
};

/** Fail fast at server boot when the embedding config is invalid (see index.ts). */
export const assertEmbeddingConfigured = (): void => {
  // The config reader already validates provider name and required vars.
  getEmbeddingConfig();
};
