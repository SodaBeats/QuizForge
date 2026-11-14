import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error('GROQ_API_KEY is not set');
}

export const groq = new Groq({
  apiKey,
  maxRetries: 2, // SDK retries 429/5xx with backoff (default is 2)
  timeout: 30_000, // ms; fail instead of hanging forever
});
