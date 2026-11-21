/**
 * Single entry point for chat-completions AI calls — the only module that
 * knows which OpenAI-compatible provider serves them and how to call it.
 *
 * Provider is selected purely by env (see .env.example):
 *
 *   AI_API_KEY     REQUIRED — bearer token for the provider
 *   AI_BASE_URL    default 'https://api.groq.com/openai/v1'
 *                  (request goes to {AI_BASE_URL}/chat/completions)
 *   AI_MODEL       default 'openai/gpt-oss-120b'
 *   AI_TIMEOUT_MS  per-attempt timeout; default 30000 (plain integer;
 *                  underscores rejected — same rule as EMBEDDING_TIMEOUT_MS)
 *
 * Follows lib/embedText.ts: env is read at call time (merely importing this
 * module never requires env) and assertAiConfigured() fails fast at server
 * boot (called from index.ts).
 *
 * Retries mirror the old groq-sdk defaults (groq-sdk/client.js): 2 retries on
 * connection errors/timeouts and on 408/409/429/5xx (obeying x-should-retry),
 * honoring retry-after-ms / retry-after headers, else exponential backoff
 * (0.5s doubling, max 8s) with up-to-25% jitter.
 */

const DEFAULT_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_TIMEOUT_MS = 30_000;
/** Extra attempts after the first one (groq-sdk maxRetries: 2). */
const MAX_RETRIES = 2;

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionOptions = {
  messages: ChatMessage[];
  /** Passed through only when provided (some models reject unknown params). */
  response_format?: { type: 'json_object' };
  reasoning_effort?: string;
};

/** Minimal OpenAI-shaped response — call sites read choices[0].message.content. */
export type ChatCompletionResponse = {
  choices: Array<{ message: { content: string | null } }>;
};

type AiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

/**
 * Read + validate AI config from env. Throws a descriptive error for a
 * missing key or invalid timeout, so both chatCompletion() and the boot
 * assert share one validation path.
 */
const getAiConfig = (): AiConfig => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI_API_KEY is not set');
  }

  const timeoutRaw = process.env.AI_TIMEOUT_MS;
  // Plain positive integer of milliseconds. Numeric separators like '30_000'
  // are a JS-literal feature only — Number('30_000') is NaN, so .env must
  // carry a plain value (e.g. 30000).
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid AI_TIMEOUT_MS '${timeoutRaw}'`);
  }

  return {
    apiKey,
    baseUrl: (process.env.AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    timeoutMs,
  };
};

/** Sleep helper for retry backoff. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retryable response? Same predicate as groq-sdk: x-should-retry wins,
 * otherwise 408/409/429/5xx.
 */
const isRetryable = (response: Response): boolean => {
  const header = response.headers.get('x-should-retry');
  if (header === 'true') return true;
  if (header === 'false') return false;
  return (
    response.status === 408 ||
    response.status === 409 ||
    response.status === 429 ||
    response.status >= 500
  );
};

/**
 * Delay before retry `retryIndex` (0-based): server-requested delays first
 * (retry-after-ms, then retry-after as seconds or HTTP-date), else the SDK's
 * exponential backoff with jitter — min(0.5 * 2^retryIndex, 8) seconds,
 * multiplied by a random factor in [0.75, 1].
 */
const retryDelayMs = (response: Response | undefined, retryIndex: number): number => {
  if (response) {
    const msRaw = response.headers.get('retry-after-ms');
    const ms = msRaw === null ? NaN : parseFloat(msRaw);
    if (Number.isFinite(ms) && ms >= 0) return ms;

    const afterRaw = response.headers.get('retry-after');
    if (afterRaw !== null) {
      const seconds = parseFloat(afterRaw);
      if (Number.isFinite(seconds)) return seconds * 1000;
      const dateMs = Date.parse(afterRaw) - Date.now();
      if (Number.isFinite(dateMs) && dateMs >= 0) return dateMs;
    }
  }

  const backoffSeconds = Math.min(0.5 * Math.pow(2, retryIndex), 8);
  const jitter = 1 - Math.random() * 0.25;
  return backoffSeconds * jitter * 1000;
};

/**
 * POST one chat-completions request. Retries transient failures (see module
 * doc), then throws with status + body snippet (embedText.postJson style).
 * A per-attempt timeout or connection error throws the same way after
 * retries are exhausted.
 */
export const chatCompletion = async (
  options: ChatCompletionOptions,
): Promise<ChatCompletionResponse> => {
  const config = getAiConfig();
  const url = `${config.baseUrl}/chat/completions`;
  const body = JSON.stringify({
    model: config.model,
    messages: options.messages,
    ...(options.response_format && { response_format: options.response_format }),
    ...(options.reasoning_effort && { reasoning_effort: options.reasoning_effort }),
  });

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body,
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (err) {
      // Connection failure or per-attempt timeout — retry like the SDK does.
      const detail = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES) {
        await sleep(retryDelayMs(undefined, attempt));
        continue;
      }
      throw new Error(`AI request to ${url} failed: ${detail}`);
    }

    if (response.ok) {
      try {
        return (await response.json()) as ChatCompletionResponse;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new Error(`AI request to ${url} returned invalid JSON: ${detail}`);
      }
    }

    if (isRetryable(response) && attempt < MAX_RETRIES) {
      // Drain the unused body so the connection can be reused before waiting.
      await response.body?.cancel().catch(() => undefined);
      await sleep(retryDelayMs(response, attempt));
      continue;
    }

    const text = await response.text().catch(() => '');
    throw new Error(
      `AI request to ${url} failed: HTTP ${response.status} ${text.slice(0, 200)}`,
    );
  }
};

/** Fail fast at server boot when the AI config is invalid (see index.ts). */
export const assertAiConfigured = (): void => {
  // The config reader already validates the key and timeout.
  getAiConfig();
};
