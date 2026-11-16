//index.js
import app from './server.js';
import { assertGroqConfigured } from './lib/groq.js';

// Fail fast at boot if GROQ_API_KEY is missing (the Groq client itself is
// constructed lazily on first use, so imports stay safe — e.g. in tests).
assertGroqConfigured();

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});
