import { jest } from '@jest/globals';
import { chatCompletion, assertAiConfigured } from '../../lib/aiClient.js';

// aiClient.ts reads env at call time and talks via global fetch, so tests only
// need to stub fetch and manage process.env — no ESM module mocking.
// Same pattern as embedText.unit.test.ts.
const fetchMock = jest.fn<
  (url: string, init: RequestInit) => Promise<unknown>
>();
const originalFetch = global.fetch;

const ENV_KEYS = [
  'AI_API_KEY',
  'AI_BASE_URL',
  'AI_MODEL',
  'AI_TIMEOUT_MS',
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

/** Non-2xx double; `headers` backs the x-should-retry / retry-after* lookups. */
const errorResponse = (
  status: number,
  text = '',
  headers: Record<string, string> = {},
) => ({
  ok: false,
  status,
  headers: new Headers(headers),
  text: () => Promise.resolve(text),
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

const MESSAGES = [{ role: 'user' as const, content: 'hi' }];

const OK_COMPLETION = { choices: [{ message: { content: 'ok' } }] };

const setValidEnv = () => {
  process.env.AI_API_KEY = 'test-key';
};

describe('chatCompletion config', () => {
  it('throws when AI_API_KEY is missing (and never calls fetch)', async () => {
    await expect(chatCompletion({ messages: MESSAGES })).rejects.toThrow(
      'AI_API_KEY is not set',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws on a non-numeric AI_TIMEOUT_MS', async () => {
    setValidEnv();
    process.env.AI_TIMEOUT_MS = 'soon';

    await expect(chatCompletion({ messages: MESSAGES })).rejects.toThrow(
      'Invalid AI_TIMEOUT_MS',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('chatCompletion request shape', () => {
  it('POSTs to the default Groq URL with Bearer auth and default model', async () => {
    setValidEnv();
    fetchMock.mockResolvedValue(okJson(OK_COMPLETION));

    const result = await chatCompletion({ messages: MESSAGES });

    expect(result).toEqual(OK_COMPLETION);
    expect(fetchCall(0)[0]).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    );
    const headers = fetchCall(0)[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-key');
    expect(headers['Content-Type']).toBe('application/json');
    expect(requestBody(0).model).toBe('openai/gpt-oss-120b');
    expect(requestBody(0).messages).toEqual(MESSAGES);
  });

  it('honors AI_BASE_URL (trailing slash stripped) and AI_MODEL', async () => {
    setValidEnv();
    process.env.AI_BASE_URL = 'https://api.openai.com/v1/';
    process.env.AI_MODEL = 'gpt-4o-mini';
    fetchMock.mockResolvedValue(okJson(OK_COMPLETION));

    await chatCompletion({ messages: MESSAGES });

    expect(fetchCall(0)[0]).toBe('https://api.openai.com/v1/chat/completions');
    expect(requestBody(0).model).toBe('gpt-4o-mini');
  });

  it('omits optional params when absent and passes them through when given', async () => {
    setValidEnv();
    fetchMock.mockResolvedValue(okJson(OK_COMPLETION));

    await chatCompletion({ messages: MESSAGES });
    expect('response_format' in requestBody(0)).toBe(false);
    expect('reasoning_effort' in requestBody(0)).toBe(false);

    await chatCompletion({
      messages: MESSAGES,
      response_format: { type: 'json_object' },
      reasoning_effort: 'medium',
    });
    expect(requestBody(1).response_format).toEqual({ type: 'json_object' });
    expect(requestBody(1).reasoning_effort).toBe('medium');
  });
});

describe('chatCompletion retries (groq-sdk parity)', () => {
  it('does not retry a non-retryable 4xx — throws after a single call', async () => {
    setValidEnv();
    fetchMock.mockResolvedValue(errorResponse(400, 'bad request'));

    await expect(chatCompletion({ messages: MESSAGES })).rejects.toThrow(
      'HTTP 400 bad request',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a 500 with default backoff, then returns the success body', async () => {
    setValidEnv();
    fetchMock
      .mockResolvedValueOnce(errorResponse(500, 'oops'))
      .mockResolvedValueOnce(okJson(OK_COMPLETION));

    const startedAt = Date.now();
    const result = await chatCompletion({ messages: MESSAGES });
    const elapsedMs = Date.now() - startedAt;

    expect(result.choices[0]?.message.content).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Default backoff: 0.5s × jitter [0.75, 1] → ≥375ms (300 leaves slack
    // for timer imprecision; a missing sleep would fail this).
    expect(elapsedMs).toBeGreaterThanOrEqual(300);
  });

  it('gives up after 3 attempts on 429 (2 retries) and reports the status', async () => {
    setValidEnv();
    // retry-after-ms: 0 keeps the suite fast and proves the header is honored.
    fetchMock.mockResolvedValue(
      errorResponse(429, 'rate limited', { 'retry-after-ms': '0' }),
    );

    await expect(chatCompletion({ messages: MESSAGES })).rejects.toThrow(
      'HTTP 429 rate limited',
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries connection errors', async () => {
    setValidEnv();
    fetchMock
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce(okJson(OK_COMPLETION));

    const result = await chatCompletion({ messages: MESSAGES });

    expect(result.choices[0]?.message.content).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('assertAiConfigured', () => {
  it('throws without AI_API_KEY and passes once set', () => {
    expect(() => assertAiConfigured()).toThrow('AI_API_KEY is not set');

    process.env.AI_API_KEY = 'test-key';
    expect(() => assertAiConfigured()).not.toThrow();
  });

  it('throws on an invalid AI_TIMEOUT_MS', () => {
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_TIMEOUT_MS = 'soon';

    expect(() => assertAiConfigured()).toThrow('Invalid AI_TIMEOUT_MS');
  });
});
