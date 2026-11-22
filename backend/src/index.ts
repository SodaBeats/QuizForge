//index.js
import app from './server.js';
import { db } from './db/db.js';
import { assertAiConfigured } from './lib/aiClient.js';
import { assertEmbeddingConfigured } from './lib/embedText.js';
import { finalizeExpiredAttempts } from './jobs/finalizeExpiredAttempts.js';

// Fail fast at boot if AI_API_KEY is missing (the chat client is trivial —
// env is read at call time, so imports stay safe — e.g. in tests).
assertAiConfigured();

// Fail fast at boot if the embedding provider config is invalid (same lazy
// pattern — embedText.ts reads env at call time, so imports stay safe).
assertEmbeddingConfigured();

// Auto submit expired exam attempts
const run = () => finalizeExpiredAttempts(db).catch(console.error);
run();
setInterval(run, 60_000);

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});
