/**
 * Single entry point for text embeddings — the only module that knows which
 * provider serves them and how to call it.
 *
 * Provider/model/auth all come from env (see .env.example), so switching local
 * Ollama → an online API at deployment is a config change, not a code change:
 *
 *   EMBEDDING_PROVIDER   'ollama' (default) | 'openai' (OpenAI-compatible /embeddings)
 *   EMBEDDING_MODEL      default 'mxbai-embed-large:latest' for ollama; REQUIRED for openai
 *   EMBEDDING_API_KEY    REQUIRED for openai
 *   EMBEDDING_BASE_URL   openai only; default 'https://api.openai.com/v1'
 *   OLLAMA_HOST          ollama only; default 'http://localhost:11434'
 *   EMBEDDING_TIMEOUT_MS per-request timeout; default 120000 (local CPU embedding
 *                        of a large batch can be slow)
 *
 * Follows lib/groq.ts: env is read at call time (merely importing this module
 * never requires env) and assertEmbeddingConfigured() fails fast at server boot
 * (called from index.ts).
 */

/** RAG query prefix — must stay identical for stored and query vectors to match. */
export const QUERY_PREFIX =
  'Represent this sentence for searching relevant passages: ';

/** Online APIs cap inputs per request — embed in sequential sub-batches of this size. */
const EMBED_BATCH_SIZE = 100;

const DEFAULT_OLLAMA_MODEL = 'mxbai-embed-large:latest';
const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_TIMEOUT_MS = 120_000;

type EmbeddingProvider = 'ollama' | 'openai';

type EmbeddingConfig =
  | { provider: 'ollama'; model: string; host: string; timeoutMs: number }
  | {
      provider: 'openai';
      model: string;
      apiKey: string;
      baseUrl: string;
      timeoutMs: number;
    };

/**
 * Read + validate embedding config from env. Throws a descriptive error for an
 * unknown provider or a missing required var, so both embedText() and the boot
 * assert share one validation path.
 */
const getEmbeddingConfig = (): EmbeddingConfig => {
  const provider = process.env.EMBEDDING_PROVIDER || 'ollama';
  if (provider !== 'ollama' && provider !== 'openai') {
    throw new Error(
      `Unknown EMBEDDING_PROVIDER '${provider}' (expected 'ollama' or 'openai')`,
    );
  }

  const timeoutRaw = process.env.EMBEDDING_TIMEOUT_MS;
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid EMBEDDING_TIMEOUT_MS '${timeoutRaw}'`);
  }

  if (provider === 'openai') {
    const apiKey = process.env.EMBEDDING_API_KEY;
    const model = process.env.EMBEDDING_MODEL;
    if (!apiKey) {
      throw new Error(
        'EMBEDDING_API_KEY is not set (required when EMBEDDING_PROVIDER=openai)',
      );
    }
    if (!model) {
      throw new Error(
        'EMBEDDING_MODEL is not set (required when EMBEDDING_PROVIDER=openai)',
      );
    }
    return {
      provider: 'openai',
      model,
      apiKey,
      baseUrl: (
        process.env.EMBEDDING_BASE_URL || DEFAULT_OPENAI_BASE_URL
      ).replace(/\/+$/, ''),
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

const embedViaOpenAI = async (
  inputs: string[],
  config: Extract<EmbeddingConfig, { provider: 'openai' }>,
): Promise<number[][]> => {
  const json = (await postJson(
    `${config.baseUrl}/embeddings`,
    { model: config.model, input: inputs },
    { Authorization: `Bearer ${config.apiKey}` },
    config.timeoutMs,
  )) as { data?: Array<{ index?: number; embedding?: number[] }> };

  const data = json.data ?? [];
  // OpenAI guarantees data[i].index ordering; sort defensively (the count check
  // below still catches missing entries).
  const ordered = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return ordered.map((entry) => entry.embedding ?? []);
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

/**
 * Embed a batch of texts. Returns vectors in input order.
 * Throws on misconfiguration, HTTP failure, or any count/dimension mismatch.
 */
export const embedText = async (inputs: string[]): Promise<number[][]> => {
  if (!Array.isArray(inputs) || inputs.length < 1) {
    throw new Error('embedText requires at least one input');
  }

  const config = getEmbeddingConfig();
  const results: number[][] = [];

  for (let start = 0; start < inputs.length; start += EMBED_BATCH_SIZE) {
    const batch = inputs.slice(start, start + EMBED_BATCH_SIZE);
    const vectors =
      config.provider === 'ollama'
        ? await embedViaOllama(batch, config)
        : await embedViaOpenAI(batch, config);
    validateBatch(vectors, batch.length);
    results.push(...vectors);
  }

  return results;
};

/**
 * Embed one RAG query with QUERY_PREFIX so it lands in the same vector space
 * as the stored document chunks.
 */
export const embedQuery = async (query: string): Promise<number[]> => {
  const [first] = await embedText([`${QUERY_PREFIX}${query}`]);
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
