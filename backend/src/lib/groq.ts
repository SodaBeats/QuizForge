import Groq from 'groq-sdk';

let client: Groq | undefined;

/**
 * Construct the Groq client lazily on first use so that merely importing
 * this module (e.g. from unit tests) never requires GROQ_API_KEY — only
 * actually calling an AI endpoint does. Server boot still fails fast via
 * assertGroqConfigured() in index.ts.
 */
export const getGroq = (): Groq => {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    client = new Groq({
      apiKey,
      maxRetries: 2, // SDK retries 429/5xx with backoff (default is 2)
      timeout: 30_000, // SDK fail instead of hanging forever
    });
  }
  return client;
};

/** Fail fast at server boot when GROQ_API_KEY is missing (see index.ts). */
export const assertGroqConfigured = (): void => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }
};
