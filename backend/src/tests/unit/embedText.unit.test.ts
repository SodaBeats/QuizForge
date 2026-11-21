import { jest } from '@jest/globals';
import {
  embedText,
  embedQuery,
  assertEmbeddingConfigured,
} from '../../lib/embedText.js';

// embedText.ts reads env at call time and talks via global fetch, so tests only
// need to stub fetch and manage process.env — no ESM module mocking.
const fetchMock = jest.fn<
  (url: string, init: RequestInit) => Promise<unknown>
>();
const originalFetch = global.fetch;

const ENV_KEYS = [
  'EMBEDDING_PROVIDER',
  'EMBEDDING_MODEL',
  'EMBEDDING_TIMEOUT_MS',
  'OLLAMA_HOST',
  'JINA_API_KEY',
  'JINA_EMBED_MODEL',
  'JINA_BASE_URL',
] as const;

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  for (const key of ENV_KEYS) {
    const value = savedEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

const okJson = (body: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
});

const fetchCall = (index: number): [string, RequestInit] => {
  const call = fetchMock.mock.calls[index];
  if (!call) {
    throw new Error(`fetch was not called at index ${index}`);
  }
  return call;
};

const requestBody = (index: number): Record<string, unknown> =>
  JSON.parse(String(fetchCall(index)[1].body)) as Record<string, unknown>;

const batchSizes = (): number[] =>
  fetchMock.mock.calls.map((call) => {
    const init = call[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { input: string[] };
    return body.input.length;
  });

describe('embedText (default provider: ollama)', () => {
  it('POSTs to the local /api/embed endpoint with the default model', async () => {
    fetchMock.mockResolvedValue(okJson({ embeddings: [[0.1, 0.2], [0.3, 0.4]] }));

    const result = await embedText(['alpha', 'beta']);

    expect(result).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(fetchCall(0)[0]).toBe('http://localhost:11434/api/embed');
    expect(requestBody(0).model).toBe('mxbai-embed-large:latest');
    expect(requestBody(0).input).toEqual(['alpha', 'beta']);
  });

  it('honors OLLAMA_HOST and EMBEDDING_MODEL overrides', async () => {
    process.env.OLLAMA_HOST = 'http://custom-host:11434';
    process.env.EMBEDDING_MODEL = 'other-embed-model';
    fetchMock.mockResolvedValue(okJson({ embeddings: [[1]] }));

    await embedText(['x']);

    expect(fetchCall(0)[0]).toBe('http://custom-host:11434/api/embed');
    expect(requestBody(0).model).toBe('other-embed-model');
  });

  it('rejects an empty input list', async () => {
    await expect(embedText([])).rejects.toThrow('at least one input');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on embedding count mismatch', async () => {
    fetchMock.mockResolvedValue(okJson({ embeddings: [[0.1]] }));

    await expect(embedText(['a', 'b'])).rejects.toThrow(
      'Embedding count mismatch: expected 2, got 1',
    );
  });

  it('throws when a returned vector is empty', async () => {
    fetchMock.mockResolvedValue(okJson({ embeddings: [[], [0.1]] }));

    await expect(embedText(['a', 'b'])).rejects.toThrow(/empty/i);
  });

  it('throws when vectors in a batch have different dimensions', async () => {
    fetchMock.mockResolvedValue(okJson({ embeddings: [[0.1, 0.2], [0.3]] }));

    await expect(embedText(['a', 'b'])).rejects.toThrow(/dimension mismatch/i);
  });

  it('splits 250 inputs into sub-batches of 16 (15×16 + 10) and concatenates in order', async () => {
    const inputs = Array.from({ length: 250 }, (_, i) => `chunk-${i}`);
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { input: string[] };
      return Promise.resolve(
        okJson({
          embeddings: body.input.map((text) => [Number(text.split('-')[1])]),
        }),
      );
    });

    const result = await embedText(inputs);

    expect(fetchMock).toHaveBeenCalledTimes(16);
    expect(batchSizes()).toEqual([...Array(15).fill(16), 10]);
    expect(result).toHaveLength(250);
    expect(result[0]).toEqual([0]);
    expect(result[16]).toEqual([16]);
    expect(result[249]).toEqual([249]);
  });

  it('throws with the HTTP status on non-2xx responses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('rate limited'),
    });

    await expect(embedText(['a'])).rejects.toThrow('HTTP 429');
  });
});

describe('embedQuery (ollama)', () => {
  it('applies the exact RAG prefix and returns the first vector', async () => {
    fetchMock.mockResolvedValue(okJson({ embeddings: [[1, 2, 3]] }));

    const result = await embedQuery('photosynthesis');

    expect(result).toEqual([1, 2, 3]);
    // Hardcoded literal (not QUERY_PREFIX) so an accidental prefix change fails here.
    expect(requestBody(0).input).toEqual([
      'Represent this sentence for searching relevant passages: photosynthesis',
    ]);
  });
});

describe('embedText (provider=jina)', () => {
  beforeEach(() => {
    process.env.EMBEDDING_PROVIDER = 'jina';
  });

  it('throws when JINA_API_KEY is missing', async () => {
    process.env.JINA_EMBED_MODEL = 'jina-embeddings-v5-omni-small';

    await expect(embedText(['a'])).rejects.toThrow('JINA_API_KEY is not set');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when JINA_EMBED_MODEL is missing', async () => {
    process.env.JINA_API_KEY = 'test-key';

    await expect(embedText(['a'])).rejects.toThrow('JINA_EMBED_MODEL is not set');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs to the default base URL with Bearer auth, task=passage, sorted by index', async () => {
    process.env.JINA_API_KEY = 'test-key';
    process.env.JINA_EMBED_MODEL = 'jina-embeddings-v5-omni-small';
    fetchMock.mockResolvedValue(
      okJson({
        data: [
          { index: 1, embedding: [3, 4] },
          { index: 0, embedding: [1, 2] },
        ],
      }),
    );

    const result = await embedText(['a', 'b']);

    expect(result).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(fetchCall(0)[0]).toBe('https://api.jina.ai/v1/embeddings');
    const headers = fetchCall(0)[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-key');
    expect(requestBody(0).model).toBe('jina-embeddings-v5-omni-small');
    expect(requestBody(0).input).toEqual(['a', 'b']);
    expect(requestBody(0).task).toBe('retrieval.passage');
    expect(requestBody(0).truncate).toBe(true);
  });

  it('honors JINA_BASE_URL override (trailing slash stripped)', async () => {
    process.env.JINA_API_KEY = 'test-key';
    process.env.JINA_EMBED_MODEL = 'jina-embeddings-v5-omni-small';
    process.env.JINA_BASE_URL = 'https://eu.api.jina.ai/v1/';
    fetchMock.mockResolvedValue(okJson({ data: [{ index: 0, embedding: [9] }] }));

    const result = await embedText(['a']);

    expect(result).toEqual([[9]]);
    expect(fetchCall(0)[0]).toBe('https://eu.api.jina.ai/v1/embeddings');
  });

  it('embedQuery uses task=retrieval.query with the raw query (no text prefix)', async () => {
    process.env.JINA_API_KEY = 'test-key';
    process.env.JINA_EMBED_MODEL = 'jina-embeddings-v5-omni-small';
    fetchMock.mockResolvedValue(okJson({ data: [{ index: 0, embedding: [7] }] }));

    const result = await embedQuery('photosynthesis');

    expect(result).toEqual([7]);
    expect(requestBody(0).input).toEqual(['photosynthesis']);
    expect(requestBody(0).task).toBe('retrieval.query');
  });
});

describe('assertEmbeddingConfigured', () => {
  it('passes with a bare env (default ollama needs no vars)', () => {
    expect(() => assertEmbeddingConfigured()).not.toThrow();
  });

  it('fails when provider=jina lacks key or model, then passes once set', () => {
    process.env.EMBEDDING_PROVIDER = 'jina';
    expect(() => assertEmbeddingConfigured()).toThrow('JINA_API_KEY');

    process.env.JINA_API_KEY = 'test-key';
    expect(() => assertEmbeddingConfigured()).toThrow('JINA_EMBED_MODEL');

    process.env.JINA_EMBED_MODEL = 'jina-embeddings-v5-omni-small';
    expect(() => assertEmbeddingConfigured()).not.toThrow();
  });

  it('fails on an unknown provider name', () => {
    process.env.EMBEDDING_PROVIDER = 'banana';
    expect(() => assertEmbeddingConfigured()).toThrow('Unknown EMBEDDING_PROVIDER');
  });

  it('fails on a non-numeric EMBEDDING_TIMEOUT_MS', () => {
    process.env.EMBEDDING_TIMEOUT_MS = 'soon';
    expect(() => assertEmbeddingConfigured()).toThrow('Invalid EMBEDDING_TIMEOUT_MS');
  });
});
